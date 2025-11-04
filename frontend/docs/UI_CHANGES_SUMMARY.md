# Résumé des modifications UI

## ✅ Changements effectués

### 1. Support des inputs number dans le Builder
**Problème** : Les champs de poids LoRA (type `number`) n'étaient pas affichés dans le Builder.

**Solution** : Ajout du rendu pour les inputs de type `number` avec :
- Input numérique standard
- Slider visuel pour meilleure UX
- Initialisation par défaut (valeur `default` ou `min` si défini)

**Emplacement** : Lignes 199-224 de `WorkflowRunner.vue`

---

### 2. Mode Builder par défaut
**Problème** : L'application démarrait en mode Template avec un toggle pour passer en Builder.

**Solution** :
- `builderMode = ref(true)` au lieu de `false`
- Retrait du toggle Template/Builder
- Simplification du header

**Impact** : L'utilisateur arrive directement sur l'interface de création de workflow.

---

## Interface avant/après

### Avant
```
[Templates | Builder ▼]  [Charger ▼]
```
- 2 modes (Template/Builder)
- Toggle pour basculer
- Dropdown templates

### Après
```
[Importer]  [Exporter]  [Sauvegarder]
```
- Mode Builder uniquement
- Actions directement accessibles
- Interface épurée

---

## Inputs LoRA maintenant fonctionnels

### Configuration des poids
```
loraScaleTransformer: {
  type: 'number',
  label: 'Poids LoRA 1',
  min: 0,
  max: 2,
  step: 0.1,
  default: 1.0
}
```

### Rendu dans le Builder
- ✅ Champ input numérique (0-2)
- ✅ Slider visuel pour ajustement précis
- ✅ Label avec valeur affichée en temps réel
- ✅ Valeur par défaut : 1.0

---

## Fichiers modifiés

1. `/frontend/src/components/WorkflowRunner.vue`
   - Lignes 1-36 : Header simplifié (retrait toggle)
   - Lignes 199-224 : Support inputs number avec slider
   - Lignes 835-843 : Initialisation par défaut pour type number
   - Ligne 758 : `builderMode = ref(true)`

---

## Tests à faire

1. ✅ L'app démarre en mode Builder
2. ✅ Ajouter une tâche `generate_video_i2v`
3. ✅ Vérifier que les champs LoRA s'affichent :
   - URL LoRA 1 (input texte)
   - Poids LoRA 1 (input number + slider)
   - URL LoRA 2 (input texte)
   - Poids LoRA 2 (input number + slider)
4. ✅ Ajuster les poids avec le slider (0-2)
5. ✅ Exécuter le workflow avec les LoRA configurés
