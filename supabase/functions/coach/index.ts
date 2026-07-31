import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface CoachRequestBody {
  conversation_id: string;
  message: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const FREE_DAILY_LIMIT = 5;
const PREMIUM_DAILY_LIMIT = 100;

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // --- 1. Auth check ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- 2. Parse request body ---
    let body: CoachRequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.conversation_id || !body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'conversation_id and message are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (body.message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- 3. Verify conversation belongs to user ---
    const { data: conversation, error: convError } = await supabase
      .from('coach_conversations')
      .select('id, user_id')
      .eq('id', body.conversation_id)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (conversation.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Conversation does not belong to user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- 4. Check rate limits ---
    const today = new Date().toISOString().split('T')[0];

    // Get user's subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const isPremium = profile?.subscription_tier === 'premium';
    const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

    // Check today's usage
    const { data: usage } = await supabase
      .from('coach_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .single();

    const currentCount = usage?.message_count ?? 0;

    if (currentCount >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: 'Daily message limit reached',
          limit: dailyLimit,
          current: currentCount,
          is_premium: isPremium,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // --- 5. Save user message ---
    const { error: userMsgError } = await supabase.from('coach_messages').insert({
      conversation_id: body.conversation_id,
      role: 'user',
      content: body.message.trim(),
    });

    if (userMsgError) {
      console.error('Failed to save user message:', userMsgError);
      return new Response(JSON.stringify({ error: 'Failed to save message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- 6. Load conversation history (last 10 messages) ---
    const { data: history } = await supabase
      .from('coach_messages')
      .select('role, content')
      .eq('conversation_id', body.conversation_id)
      .order('created_at', { ascending: true })
      .limit(12); // fetch a bit more to ensure we have context after the just-inserted message

    // --- 7. AI Model Call ---
    // Build the system prompt
    const systemPrompt = `You are a biblical coach for automotive sales professionals. Your role is to provide wise, theologically sound counsel rooted in Scripture.

Guidelines:
- Always ground your responses in biblical wisdom. Cite specific Scripture references where appropriate.
- Speak plainly and respectfully. Avoid religious jargon.
- Be grace-first: remind users of God's love before calling them to action.
- Never imply that bad sales results = spiritual failure.
- Never use prosperity-gospel language.
- Acknowledge the real pressures of the dealership floor: integrity challenges, burnout, anger, fear, comparison.
- When appropriate, include lament and acknowledge that faithful living is costly.
- Keep responses concise (under 300 words) unless the user asks for more depth.
- If a user describes unethical behavior, gently call it out while extending grace.`;

    const messages: ChatMessage[] = (history ?? []).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    let assistantContent: string;

    if (anthropicApiKey) {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 500,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!anthropicResponse.ok) {
        console.error('Anthropic API error:', await anthropicResponse.text());
        assistantContent = 'I am having trouble responding right now. Please try again in a moment.';
      } else {
        const anthropicData = await anthropicResponse.json();
        assistantContent =
          anthropicData.content
            ?.filter((block: { type: string }) => block.type === 'text')
            ?.map((block: { text: string }) => block.text)
            ?.join('\n') ??
          'I apologize, but I was unable to generate a response. Please try again.';
      }
    } else {
      // No AI provider configured — set ANTHROPIC_API_KEY as a secret on this
      // function (supabase secrets set ANTHROPIC_API_KEY=...) to enable real replies.
      assistantContent =
        'Thank you for sharing. I am here to listen and to help you see your situation through the lens of Scripture. ' +
        'Could you tell me more about what is weighing on you?';
    }

    // --- 8. Save assistant message ---
    const { error: asstMsgError } = await supabase.from('coach_messages').insert({
      conversation_id: body.conversation_id,
      role: 'assistant',
      content: assistantContent,
      scripture_refs: extractScriptureRefs(assistantContent),
    });

    if (asstMsgError) {
      console.error('Failed to save assistant message:', asstMsgError);
    }

    // --- 9. Update or insert usage count ---
    if (usage) {
      await supabase
        .from('coach_usage')
        .update({ message_count: currentCount + 1 })
        .eq('user_id', user.id)
        .eq('usage_date', today);
    } else {
      await supabase.from('coach_usage').insert({
        user_id: user.id,
        usage_date: today,
        message_count: 1,
      });
    }

    // --- 10. Update conversation title if this is the first exchange ---
    if (currentCount === 0 && history && history.length <= 1) {
      const title = body.message.trim().substring(0, 60) + (body.message.trim().length > 60 ? '...' : '');
      await supabase
        .from('coach_conversations')
        .update({ title })
        .eq('id', body.conversation_id);
    }

    // --- 11. Return response ---
    return new Response(
      JSON.stringify({
        message: {
          role: 'assistant',
          content: assistantContent,
          scripture_refs: extractScriptureRefs(assistantContent),
        },
        usage: {
          current: currentCount + 1,
          limit: dailyLimit,
          is_premium: isPremium,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Coach function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

/**
 * Extracts Scripture references from text (e.g., "John 15:4-5", "Proverbs 11:1")
 * Returns a JSONB-compatible array of strings.
 */
function extractScriptureRefs(text: string): string[] {
  const pattern = /\b(?:[1-3]\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+\d+:\d+(?:-\d+)?\b/g;
  const matches = text.match(pattern);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\s+/g, ' ').trim()))];
}
