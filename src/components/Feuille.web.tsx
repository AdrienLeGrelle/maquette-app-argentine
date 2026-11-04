import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Animated, Easing, Modal, StyleSheet } from 'react-native'

/** Le point d'accroche posé dans le cadre du téléphone, sur ordinateur (voir `_layout.tsx`). */
export const HOTE_FEUILLES = 'cadre-feuilles'

/**
 * Sur ordinateur, l'app tient dans un cadre de téléphone : la feuille monte
 * dans ce cadre, pas sur toute la page. Sans cadre (navigateur de téléphone),
 * la modale habituelle.
 */
export function Feuille({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const hote = typeof document !== 'undefined' ? document.getElementById(HOTE_FEUILLES) : null
  if (!hote) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        {children}
      </Modal>
    )
  }
  if (!visible) return null
  return createPortal(<Montee hauteur={hote.clientHeight}>{children}</Montee>, hote)
}

function Montee({ hauteur, children }: { hauteur: number; children: ReactNode }) {
  const [y] = useState(() => new Animated.Value(hauteur))
  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start()
  }, [y])
  return <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: y }] }]}>{children}</Animated.View>
}
