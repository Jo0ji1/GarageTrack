import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from './theme';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

/**
 * Captura erros de renderização e ciclo de vida em toda a árvore filha.
 * Garante que o app não trave em tela branca; oferece reset manual.
 *
 * Em produção, encaminhar para Sentry/Crashlytics via `componentDidCatch`.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, componentStack: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Em desenvolvimento, deixa visível no console do Metro.
    // Em produção, plugue aqui um serviço de telemetria.
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? null });
  }

  private handleReset = () => {
    this.setState({ error: null, componentStack: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Algo deu errado</Text>
        <Text style={styles.subtitle}>
          O app encontrou um problema inesperado. Seus dados estão salvos no banco local.
        </Text>
        <View style={styles.details}>
          <Text style={styles.detailsTitle}>Detalhes técnicos</Text>
          <Text style={styles.detailsText} numberOfLines={6}>
            {this.state.error.message}
          </Text>
        </View>
        <Pressable style={styles.button} onPress={this.handleReset}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.graphite,
  },
  details: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  detailsTitle: {
    ...typography.eyebrow,
    color: colors.graphite,
  },
  detailsText: {
    ...typography.body,
    color: colors.danger,
  },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.subtitle,
    color: colors.paper,
  },
});
