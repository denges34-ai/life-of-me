// Modèles de valise. Appliquer un modèle ajoute ses objets à la liste du voyage,
// qui reste ensuite entièrement personnalisable (ajout, suppression).

export interface PackingTemplate {
  id: string
  label: string
  icon: string
  items: string[]
}

const BASICS = ['Papiers d\'identité', 'Téléphone et chargeur', 'Portefeuille', 'Sous-vêtements', 'Chaussettes', 'Brosse à dents et dentifrice', 'Médicaments']

export const PACKING_TEMPLATES: PackingTemplate[] = [
  {
    id: 'weekend',
    label: 'Week-end',
    icon: '🎒',
    items: [...BASICS, 'T-shirts', 'Pantalon', 'Pull', 'Pyjama', 'Déodorant'],
  },
  {
    id: 'beach',
    label: 'Plage',
    icon: '🏖️',
    items: [...BASICS, 'Maillot de bain', 'Serviette de plage', 'Crème solaire', 'Lunettes de soleil', 'Casquette ou chapeau', 'Tongs', 'Shorts', 'T-shirts', 'Après-soleil'],
  },
  {
    id: 'ski',
    label: 'Ski',
    icon: '⛷️',
    items: [...BASICS, 'Veste de ski', 'Pantalon de ski', 'Gants', 'Bonnet', 'Masque ou lunettes', 'Sous-couches thermiques', 'Chaussettes de ski', 'Crème solaire', 'Baume à lèvres', 'Forfait'],
  },
  {
    id: 'city',
    label: 'Ville',
    icon: '🏙️',
    items: [...BASICS, 'Chaussures confortables', 'Veste', 'T-shirts', 'Pantalon', 'Batterie externe', 'Adaptateur de prise', 'Sac à dos', 'Parapluie'],
  },
]
