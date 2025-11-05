import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier des collections
const COLLECTIONS_DIR = path.join(__dirname, '..', 'collections');

// Fichier pour stocker la collection courante
const CURRENT_COLLECTION_FILE = path.join(COLLECTIONS_DIR, '_current.json');

/**
 * Service de gestion des collections d'images
 * Structure d'une collection :
 * {
 *   id: string,
 *   name: string,
 *   description?: string,
 *   createdAt: Date,
 *   updatedAt: Date,
 *   images: [
 *     {
 *       url: string,
 *       description?: string,
 *       addedAt: Date
 *     }
 *   ]
 * }
 */

/**
 * Initialise le système de collections
 */
export async function initializeCollections() {
  try {
    // Créer le dossier collections s'il n'existe pas
    await fs.mkdir(COLLECTIONS_DIR, { recursive: true });
    
    // Vérifier s'il y a une collection par défaut
    const collections = await getAllCollections();
    
    if (collections.length === 0) {
      // Créer une collection par défaut
      const defaultCollection = await createCollection({
        name: 'Collection par défaut',
        description: 'Collection principale pour vos images'
      });
      
      // La définir comme collection courante
      await setCurrentCollection(defaultCollection.id);
      
      console.log('📁 Collection par défaut créée:', defaultCollection.name);
    }
    
    // Vérifier qu'il y a une collection courante
    const currentCollection = await getCurrentCollection();
    if (!currentCollection && collections.length > 0) {
      await setCurrentCollection(collections[0].id);
    }
    
    console.log('📚 Système de collections initialisé');
  } catch (error) {
    console.error('❌ Erreur initialisation collections:', error);
    throw error;
  }
}

/**
 * Récupère toutes les collections
 */
export async function getAllCollections() {
  try {
    const files = await fs.readdir(COLLECTIONS_DIR);
    const collections = [];
    
    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        try {
          const filePath = path.join(COLLECTIONS_DIR, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const collection = JSON.parse(content);
          collections.push(collection);
        } catch (error) {
          console.error(`❌ Erreur lecture collection ${file}:`, error);
        }
      }
    }
    
    // Trier par date de création (plus récent en premier)
    return collections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('❌ Erreur récupération collections:', error);
    return [];
  }
}

/**
 * Récupère une collection par son ID
 */
export async function getCollectionById(id) {
  try {
    const filePath = path.join(COLLECTIONS_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Collection ${id} non trouvée:`, error);
    return null;
  }
}

/**
 * Crée une nouvelle collection
 */
export async function createCollection({ name, description = '' }) {
  try {
    const now = new Date();
    const id = `collection_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const collection = {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      images: []
    };
    
    const filePath = path.join(COLLECTIONS_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2));
    
    console.log('✅ Collection créée:', name);
    return collection;
  } catch (error) {
    console.error('❌ Erreur création collection:', error);
    throw error;
  }
}

/**
 * Met à jour une collection
 */
export async function updateCollection(id, updates) {
  try {
    const collection = await getCollectionById(id);
    if (!collection) {
      throw new Error('Collection non trouvée');
    }
    
    const updatedCollection = {
      ...collection,
      ...updates,
      id, // S'assurer que l'ID ne change pas
      updatedAt: new Date()
    };
    
    const filePath = path.join(COLLECTIONS_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(updatedCollection, null, 2));
    
    console.log('✅ Collection mise à jour:', collection.name);
    return updatedCollection;
  } catch (error) {
    console.error('❌ Erreur mise à jour collection:', error);
    throw error;
  }
}

/**
 * Supprime une collection
 */
export async function deleteCollection(id) {
  try {
    const collection = await getCollectionById(id);
    if (!collection) {
      throw new Error('Collection non trouvée');
    }
    
    // Vérifier si c'est la collection courante
    const currentCollection = await getCurrentCollection();
    if (currentCollection && currentCollection.id === id) {
      // Définir une autre collection comme courante
      const otherCollections = (await getAllCollections()).filter(c => c.id !== id);
      if (otherCollections.length > 0) {
        await setCurrentCollection(otherCollections[0].id);
      } else {
        // Plus de collections, supprimer le fichier current
        try {
          await fs.unlink(CURRENT_COLLECTION_FILE);
        } catch {} // Ignorer si le fichier n'existe pas
      }
    }
    
    const filePath = path.join(COLLECTIONS_DIR, `${id}.json`);
    await fs.unlink(filePath);
    
    console.log('✅ Collection supprimée:', collection.name);
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression collection:', error);
    throw error;
  }
}

/**
 * Récupère la collection courante
 */
export async function getCurrentCollection() {
  try {
    const content = await fs.readFile(CURRENT_COLLECTION_FILE, 'utf-8');
    const { currentCollectionId } = JSON.parse(content);
    
    if (currentCollectionId) {
      return await getCollectionById(currentCollectionId);
    }
    
    return null;
  } catch (error) {
    // Fichier n'existe pas ou erreur de lecture
    return null;
  }
}

/**
 * Définit la collection courante
 */
export async function setCurrentCollection(collectionId) {
  try {
    // Vérifier que la collection existe
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      throw new Error('Collection non trouvée');
    }
    
    const currentData = {
      currentCollectionId: collectionId,
      updatedAt: new Date()
    };
    
    await fs.writeFile(CURRENT_COLLECTION_FILE, JSON.stringify(currentData, null, 2));
    
    console.log('📌 Collection courante définie:', collection.name);
    return collection;
  } catch (error) {
    console.error('❌ Erreur définition collection courante:', error);
    throw error;
  }
}

/**
 * Ajoute une image ou vidéo à une collection
 */
export async function addImageToCollection(collectionId, { url, mediaId, type = 'image', description = '', metadata = {} }) {
  try {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      throw new Error('Collection non trouvée');
    }
    
    const mediaEntry = {
      url,
      mediaId: mediaId || null, // UUID du média original
      type: type || 'image', // 'image' ou 'video'
      description,
      metadata: metadata || {}, // Métadonnées spécifiques (durée, fps, etc.)
      addedAt: new Date()
    };
    
    // Vérifier si le média n'existe pas déjà
    const existingMedia = collection.images.find(img => img.url === url);
    if (existingMedia) {
      console.log(`ℹ️ ${type === 'video' ? 'Vidéo' : 'Image'} déjà présente dans la collection`);
      return collection;
    }
    
    collection.images.unshift(mediaEntry); // Ajouter en début de liste
    collection.updatedAt = new Date();
    
    const filePath = path.join(COLLECTIONS_DIR, `${collectionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2));
    
    console.log(`✅ ${type === 'video' ? 'Vidéo' : 'Image'} ajoutée à la collection:`, collection.name);
    return collection;
  } catch (error) {
    console.error('❌ Erreur ajout image à collection:', error);
    throw error;
  }
}

/**
 * Ajoute une image ou vidéo à la collection courante
 */
export async function addImageToCurrentCollection({ url, mediaId, type = 'image', description = '', metadata = {} }) {
  try {
    const currentCollection = await getCurrentCollection();
    if (!currentCollection) {
      console.log('⚠️ Aucune collection courante définie');
      return null;
    }
    
    return await addImageToCollection(currentCollection.id, { url, mediaId, type, description, metadata });
  } catch (error) {
    console.error(`❌ Erreur ajout ${type === 'video' ? 'vidéo' : 'image'} à collection courante:`, error);
    throw error;
  }
}

/**
 * Supprime une image d'une collection
 */
export async function removeImageFromCollection(collectionId, imageUrl) {
  try {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      throw new Error('Collection non trouvée');
    }
    
    const initialLength = collection.images.length;
    collection.images = collection.images.filter(img => img.url !== imageUrl);
    
    if (collection.images.length === initialLength) {
      console.log('ℹ️ Image non trouvée dans la collection');
      return collection;
    }
    
    collection.updatedAt = new Date();
    
    const filePath = path.join(COLLECTIONS_DIR, `${collectionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2));
    
    console.log('✅ Image supprimée de la collection:', collection.name);
    return collection;
  } catch (error) {
    console.error('❌ Erreur suppression image de collection:', error);
    throw error;
  }
}

/**
 * Met à jour la description d'une image dans une collection
 */
export async function updateImageInCollection(collectionId, imageUrl, { description }) {
  try {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      throw new Error('Collection non trouvée');
    }
    
    const image = collection.images.find(img => img.url === imageUrl);
    if (!image) {
      throw new Error('Image non trouvée dans la collection');
    }
    
    image.description = description;
    collection.updatedAt = new Date();
    
    const filePath = path.join(COLLECTIONS_DIR, `${collectionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2));
    
    console.log('✅ Description image mise à jour dans collection:', collection.name);
    return collection;
  } catch (error) {
    console.error('❌ Erreur mise à jour image dans collection:', error);
    throw error;
  }
}