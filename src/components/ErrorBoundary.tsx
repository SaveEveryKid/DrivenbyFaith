import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠</Text>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 18,
              fontWeight: '600',
              color: '#3C3C3C',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              color: '#9B9B9B',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            {this.state.errorMessage ?? 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              backgroundColor: '#9B7343',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF',
              }}
            >
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
