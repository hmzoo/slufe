import { useQuasar } from 'quasar'

/**
 * Composable pour les notifications avec Quasar
 * Centralise la gestion des messages de notification
 */
export function useNotify() {
  const $q = useQuasar()

  /**
   * Affiche une notification
   * @param {string} message - Le message à afficher
   * @param {string} type - Le type de notification ('positive', 'negative', 'warning', 'info')
   * @param {object} options - Options supplémentaires
   */
  const showNotification = (message, type = 'info', options = {}) => {
    const defaultOptions = {
      type,
      position: 'top-right',
      timeout: 3000,
      actions: [{ label: 'Fermer', color: 'white' }],
      ...options
    }

    $q.notify({
      message,
      ...defaultOptions
    })
  }

  /**
   * Notification de succès
   */
  const showSuccess = (message, options = {}) => {
    showNotification(message, 'positive', options)
  }

  /**
   * Notification d'erreur
   */
  const showError = (message, options = {}) => {
    showNotification(message, 'negative', options)
  }

  /**
   * Notification d'avertissement
   */
  const showWarning = (message, options = {}) => {
    showNotification(message, 'warning', options)
  }

  /**
   * Notification d'information
   */
  const showInfo = (message, options = {}) => {
    showNotification(message, 'info', options)
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
