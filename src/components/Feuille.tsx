import type { ReactNode } from 'react'
import { Modal } from 'react-native'

/** Une feuille qui monte du bas, comme les fiches de WhatsApp. Sur téléphone : la modale du système. */
export function Feuille({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {children}
    </Modal>
  )
}
