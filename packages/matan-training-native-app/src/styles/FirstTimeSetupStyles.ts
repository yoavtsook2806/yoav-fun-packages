import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23', // --bg-primary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // --bg-glass
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // --border-primary
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc', // --text-primary
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#94a3b8', // --text-muted
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // --bg-glass
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  progressText: {
    fontSize: 16,
    color: '#cbd5e1', // --text-secondary
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#334155', // --border-primary
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1', // --primary
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  exerciseSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // --bg-glass
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155', // --border-primary
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc', // --text-primary
    textAlign: 'center',
    marginBottom: 12,
  },
  exerciseInfo: {
    fontSize: 16,
    color: '#cbd5e1', // --text-secondary
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  exerciseRestTime: {
    fontSize: 14,
    color: '#94a3b8', // --text-muted
    textAlign: 'center',
    fontWeight: '500',
  },
  inputsSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // --bg-glass
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155', // --border-primary
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc', // --text-primary
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#cbd5e1', // --text-secondary
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(15, 15, 35, 0.5)', // darker bg
    borderWidth: 1,
    borderColor: '#334155', // --border-primary
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc', // --text-primary
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // --bg-glass
    borderTopWidth: 1,
    borderTopColor: '#334155', // --border-primary
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#6366f1', // --primary
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#cbd5e1', // --text-secondary
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#94a3b8', // --text-muted
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
