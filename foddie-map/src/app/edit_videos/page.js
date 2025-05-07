"use client";

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import styles from '../page.module.css';
import { db } from '../FirebaseConfig.js';
import { collection, getDocs, query, where, deleteDoc, doc, addDoc, setDoc } from "firebase/firestore";
import { searchPlaces, getPlaceDetails } from '../../utils/googlePlacesService.js';
import MapComponent from '../components/MapComponent';

const EditVideos = () => {
  const [videos, setVideos] = useState([]);
  const [reviewers, setReviewers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(5); // Número de vídeos per pàgina
  const [successMessage, setSuccessMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const [viewVideoId, setViewVideoId] = useState(null); // Estado para controlar el formulario de visualización
  const [newReviewFormVisible, setNewReviewFormVisible] = useState(false);
  const [newReviewFormData, setNewReviewFormData] = useState({startSecond: '', restaurantName: '', restaurantDescription: '', restaurantGooglePlaceId: '', restaurantDirection: '',
    restaurantPhone:'', restaurantWebsite:'', restaurantFichaTripadvisor:'', restaurantFichaGoogleMaps:'', restaurantRatingGoolgeMaps:'', restaurantReviewesGoogleMaps:'', 
    restaurantPriceLevelGoogleMaps: '', restaurantImage:'',restaurantState:'', lon:'', lat: '',
  });
  const [places, setPlaces] = useState([]); // Estado para almacenar las places devueltas por la búsqueda
  const [details, setDetails] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [currentDraftPage, setCurrentDraftPage] = useState(1);
  const [draftsPerPage] = useState(1); // Número de borradores por página
  const [isEditingDraft, setIsEditingDraft] = useState(false); // Nuevo estado para modo edición
  const [editingDraftId, setEditingDraftId] = useState(null); // ID del borrador que se está editando
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  const indexOfLastDraft = currentDraftPage * draftsPerPage;
  const indexOfFirstDraft = indexOfLastDraft - draftsPerPage;
  const currentDrafts = drafts.slice(indexOfFirstDraft, indexOfLastDraft);

  const draftPageNumbers = [];
  for (let i = 1; i <= Math.ceil(drafts.length / draftsPerPage); i++) {
    draftPageNumbers.push(i);
  }

  const paginateDrafts = (pageNumber) => setCurrentDraftPage(pageNumber);

  useEffect(() => {
    fetchReviewers();
    fetchVideos();
  }, [searchQuery]);

  const showPopupWithAction = (action) => {
    setPopupAction(() => action);
    setShowPopup(true);
  };

  const hidePopup = () => {
    setShowPopup(false);
    setPopupAction(null);
  };

  const handleConfirmAction = async () => {
    if (popupAction) {
      await popupAction();
    }
    hidePopup();
  };

  const fetchReviewers = async () => {
    const reviewersSnapshot = await getDocs(collection(db, "Reviewers"));
    const reviewersData = {};
    reviewersSnapshot.forEach(doc => {
      const data = doc.data();
      reviewersData[data.ChannelID] = {
        name: data.Name,
        avatarUrl: data.AvatarURL
      };
    });
    setReviewers(reviewersData);
  };

  const fetchVideos = async () => {
    const q = searchQuery
      ? query(collection(db, "VideosToEdit"), where("Title", ">=", searchQuery), where("Title", "<=", searchQuery + '\uf8ff'))
      : collection(db, "VideosToEdit");
    const querySnapshot = await getDocs(q);
    const videosList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    videosList.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate)); // Ordenar els vídeos per data de publicació
    setVideos(videosList);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Resetear a la primera pàgina quan es realitza una nova cerca
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = (videoId) => {
    showPopupWithAction(async () => {
      try {
        await deleteDoc(doc(db, "VideosToEdit", videoId));
        setSuccessMessage('Se ha eliminado correctamente');
        fetchVideos(); // Actualizar la lista de vídeos después de eliminar uno
      } catch (e) {
        console.error("Error deleting document: ", e);
      }
    });
  };

  const handleViewClick = (videoId) => {
    setViewVideoId(videoId);
    fetchDrafts(videoId); 
  };

  const handleHideClick = () => {
    setViewVideoId(null);
  };

  const handleNewReviewClick = () => {
    if (isEditingDraft) return; // Si estás editando, no puedes crear
    setNewReviewFormVisible(true);
    setIsCreatingDraft(true); // Activar modo creación
    setIsEditingDraft(false); // Desactivar modo edición
    setEditingDraftId(null); // Asegurarnos de que no hay borrador en edición
    setNewReviewFormData({
      startSecond: '',
      restaurantName: '',
      restaurantDescription: '',
      restaurantGooglePlaceId: '',
      restaurantDirection: '',
      restaurantPhone: '',
      restaurantWebsite: '',
      restaurantFichaTripadvisor: '',
      restaurantFichaGoogleMaps: '',
      restaurantRatingGoolgeMaps: '',
      restaurantReviewesGoogleMaps: '',
      restaurantPriceLevelGoogleMaps: '',
      restaurantImage: '',
      restaurantState: '',
      lon: '',
      lat: ''
    });
  };

  const handleSaveAsBorrador = async () => {
    try {
      // Validar que todos los campos obligatorios estén completos
      if (!newReviewFormData.restaurantGooglePlaceId && 
          !newReviewFormData.restaurantName && 
          !newReviewFormData.restaurantDescription && 
          !newReviewFormData.restaurantDirection && 
          !newReviewFormData.restaurantPhone && 
          !newReviewFormData.restaurantWebsite && 
          !newReviewFormData.restaurantFichaTripadvisor && 
          !newReviewFormData.restaurantFichaGoogleMaps && 
          !newReviewFormData.restaurantReviewesGoogleMaps && 
          !newReviewFormData.restaurantPriceLevelGoogleMaps && 
          !newReviewFormData.restaurantImage && 
          !newReviewFormData.restaurantState) {
        alert("Omple totes les dades obligatories");
        return;
      }
  
      // Crear un identificador único para el subdocumento
      const subDocId = `borradorDe_${viewVideoId}_${newReviewFormData.restaurantName.replace(/[^a-zA-Z0-9]/g, "_")}`;
  
      // Guardar el documento en Firestore
      const docRef = await addDoc(
        collection(db, "VideosToEdit", viewVideoId, "Borradores"), // Subcolección "Borradores" dentro del documento "viewVideoId"
        {
          restaurantName: newReviewFormData.restaurantName,
          restaurantDescription: newReviewFormData.restaurantDescription,
          restaurantGooglePlaceId: newReviewFormData.restaurantGooglePlaceId,
          restaurantDirection: newReviewFormData.restaurantDirection,
          restaurantPhone: newReviewFormData.restaurantPhone,
          restaurantWebsite: newReviewFormData.restaurantWebsite,
          restaurantFichaTripadvisor: newReviewFormData.restaurantFichaTripadvisor,
          restaurantFichaGoogleMaps: newReviewFormData.restaurantFichaGoogleMaps,
          restaurantRatingGoolgeMaps: newReviewFormData.restaurantRatingGoolgeMaps,
          restaurantReviewesGoogleMaps: newReviewFormData.restaurantReviewesGoogleMaps,
          restaurantPriceLevelGoogleMaps: newReviewFormData.restaurantPriceLevelGoogleMaps,
          restaurantImage: newReviewFormData.restaurantImage,
          restaurantState: newReviewFormData.restaurantState,
          restaurantLat: newReviewFormData.lat,
          restaurantLon: newReviewFormData.lon,
          startSecond: newReviewFormData.startSecond,
          videoId: viewVideoId, // Referencia al video original
          path: `VideosToEdit/${viewVideoId}` // Campo adicional con el path
        }
      );
  
      // Mostrar mensaje de éxito
      setSuccessMessage('Borrador guardado con éxito.');
  
      // Actualizar la lista de borradores
      fetchDrafts(viewVideoId);
  
      // Reiniciar el formulario y el estado
      setNewReviewFormVisible(false); // Cerrar el formulario
      setIsCreatingDraft(false); // Salir del modo de creación
      setNewReviewFormData({
        startSecond: '',
        restaurantName: '',
        restaurantDescription: '',
        restaurantGooglePlaceId: '',
        restaurantDirection: '',
        restaurantPhone: '',
        restaurantWebsite: '',
        restaurantFichaTripadvisor: '',
        restaurantFichaGoogleMaps: '',
        restaurantRatingGoolgeMaps: '',
        restaurantReviewesGoogleMaps: '',
        restaurantPriceLevelGoogleMaps: '',
        restaurantImage: '',
        restaurantState: '',
        lon: '',
        lat: ''
      });
  
      console.log("Borrador guardado con éxito:", docRef.id);
  
    } catch (error) {
      console.error("Error al guardar el borrador:", error);
    }
  };

  const fetchDrafts = async (videoId, searchQuery = '') => {
    try {
      const draftsRef = collection(db, "VideosToEdit", videoId, "Borradores");
      const q = searchQuery
        ? query(draftsRef, where("restaurantName", ">=", searchQuery), where("restaurantName", "<=", searchQuery + '\uf8ff'))
        : draftsRef;
      const snapshot = await getDocs(q);
      const draftsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrafts(draftsList);
    } catch (error) {
      console.error("Error al buscar borradores:", error);
    }
  };

  const handleDraftSearchChange = (e) => {
    const query = e.target.value;
    setDraftSearchQuery(query);
    fetchDrafts(viewVideoId, query); // Actualizar la búsqueda de borradores
  };

  // Función para manejar la edición de un borrador
const handleEditDraft = (draft) => {
  if (isCreatingDraft) return; // Si estás creando, no puedes editar
  setNewReviewFormData({
    startSecond: draft.startSecond || '',
    restaurantName: draft.restaurantName || '',
    restaurantDescription: draft.restaurantDescription || '',
    restaurantGooglePlaceId: draft.restaurantGooglePlaceId || '',
    restaurantDirection: draft.restaurantDirection || '',
    restaurantPhone: draft.restaurantPhone || '',
    restaurantWebsite: draft.restaurantWebsite || '',
    restaurantFichaTripadvisor: draft.restaurantFichaTripadvisor || '',
    restaurantFichaGoogleMaps: draft.restaurantFichaGoogleMaps || '',
    restaurantRatingGoolgeMaps: draft.restaurantRatingGoolgeMaps || '',
    restaurantReviewesGoogleMaps: draft.restaurantReviewesGoogleMaps || '',
    restaurantPriceLevelGoogleMaps: draft.restaurantPriceLevelGoogleMaps || '',
    restaurantImage: draft.restaurantImage || '',
    restaurantState: draft.restaurantState || '',
    lon: draft.restaurantLon || '',
    lat: draft.restaurantLat || ''
  });
  setEditingDraftId(draft.id); // Establecemos el borrador en edición
  setIsEditingDraft(true); // Activar modo edición
  setIsCreatingDraft(false); // Desactivar modo creación
  setNewReviewFormVisible(true); // Mostrar el formulario
};

// Función para guardar cambios en el borrador editado
const handleSaveEditedDraft = async () => {
  try {
    if (editingDraftId) {
      const draftRef = doc(db, "VideosToEdit", viewVideoId, "Borradores", editingDraftId);
      await setDoc(draftRef, newReviewFormData, { merge: true }); // Actualiza el borrador
      setSuccessMessage('Borrador editado con éxito');
      fetchDrafts(viewVideoId); // Actualiza la lista de borradores
      handleCancelEdit(); // Salimos del modo edición
    }
  } catch (error) {
    console.error("Error al editar el borrador:", error);
  }
};

const handleDeleteDraft = (draftId) => {
  deleteDoc(doc(db, "VideosToEdit", viewVideoId, "Borradores", draftId))
    .then(() => {
      setSuccessMessage('Borrador eliminado con éxito');
      fetchDrafts(viewVideoId); // Actualizar la lista de borradores después de eliminar uno
    })
    .catch((error) => {
      console.error("Error deleting draft: ", error);
    });
}

// Cancelar creación o edición
const handleCancelEdit = () => {
  setIsEditingDraft(false); // Salir del modo edición
  setIsCreatingDraft(false); // Salir del modo creación
  setNewReviewFormVisible(false); // Cerrar el formulario
  setEditingDraftId(null); // Limpiar el ID del borrador en edición
  setNewReviewFormData({
    startSecond: '',
    restaurantName: '',
    restaurantDescription: '',
    restaurantGooglePlaceId: '',
    restaurantDirection: '',
    restaurantPhone: '',
    restaurantWebsite: '',
    restaurantFichaTripadvisor: '',
    restaurantFichaGoogleMaps: '',
    restaurantRatingGoolgeMaps: '',
    restaurantReviewesGoogleMaps: '',
    restaurantPriceLevelGoogleMaps: '',
    restaurantImage: '',
    restaurantState: '',
    lon: '',
    lat: ''
  });
};
  
  const handleNewReviewFormChange = (e) => {
    const { name, value } = e.target;
    setNewReviewFormData({
      ...newReviewFormData,
      [name]: value
    });
  };

  const handleSearchPlaces = async (query) => {
    try {
      const placesResult = await searchPlaces(query); // Guarda el retorno en una variable
      setPlaces(placesResult); 
      console.log("Lugares encontrados:", placesResult);
    } catch (error) {
      console.error('Error al buscar lugares:', error);
    }
  };

  const handlePlaceSelection = (placeId) => {
    setNewReviewFormData({
      ...newReviewFormData,
      restaurantGooglePlaceId: placeId // Guardar el Place ID seleccionado
    });
  };

  const handleSearchGooglePlaceId = async (query) => {
    try {
      console.log("Buscando Google Place ID:");
      const detailsResult = await getPlaceDetails(query);
      console.log("Detalles del lugar:", detailsResult);
  
      // Verificar que el objeto tiene la estructura esperada antes de continuar
      if (detailsResult) {
        setDetails(detailsResult); // Actualizar el estado (opcional)
        updateFormData(detailsResult); // Pasar el resultado directamente a la función
      } else {
        console.error("El objeto 'detailsResult' está vacío o es indefinido.");
      }
    } catch (error) {
      console.error("Error al obtener los detalles del lugar:", error);
    }
  };
  
  const updateFormData = (details) => {
    if (!details) {
      console.error("El objeto 'details' no es válido.");
      return;
    }
  
    newReviewFormData.restaurantName = details.displayName?.text || ""; 
    newReviewFormData.restaurantDirection = details.formattedAddress || "";
    newReviewFormData.restaurantPhone = details.internationalPhoneNumber || "";
    newReviewFormData.restaurantFichaGoogleMaps = details.googleMapsUri || "";
    newReviewFormData.restaurantRatingGoolgeMaps = details.rating || "";
    newReviewFormData.restaurantReviewesGoogleMaps = details.userRatingCount || "";
    newReviewFormData.restaurantPriceLevelGoogleMaps = details.priceLevel || "";
    newReviewFormData.restaurantState = details.businessStatus || "";
    newReviewFormData.lat = details.location?.latitude || "";
    newReviewFormData.lon = details.location?.longitude || "";
    console.log("Datos del formulario actualizados:", newReviewFormData);
  };

  // Obtener los vídeos actuales
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = videos.slice(indexOfFirstVideo, indexOfLastVideo);

  // Calcular el número total de páginas
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(videos.length / videosPerPage); i++) {
    pageNumbers.push(i);
  }

  const volcarInfo = async (videoId) => {
    try {
      // Obtenemos los borradores del video
      const draftsRef = collection(db, "VideosToEdit", videoId, "Borradores");
      const draftsSnapshot = await getDocs(draftsRef);
  
      if (draftsSnapshot.empty) {
        alert("No hay borradores asociados a este video para volcar.");
        return;
      }
  
      // Obtenemos la información del video para incluirla en la subcolección "videos"
      const videoData = videos.find(video => video.id === videoId);
      if (!videoData) {
        alert("No se encontró la información del video.");
        return;
      }
  
      // Creamos un documento en la colección "restaurants" por cada borrador
      const promises = draftsSnapshot.docs.map(async (doc) => {
        const draftData = doc.data();
  
        // Comprobar si ya existe un restaurante con el mismo googlePlaceId
        const existingRestaurantsQuery = query(
          collection(db, "restaurants"),
          where("googlePlaceId", "==", draftData.restaurantGooglePlaceId)
        );
        const existingRestaurantsSnapshot = await getDocs(existingRestaurantsQuery);
  
        if (!existingRestaurantsSnapshot.empty) {
          // Si existe, mostramos un mensaje y no creamos el documento
          const existingRestaurant = existingRestaurantsSnapshot.docs[0].data();
          console.log(`El restaurante "${existingRestaurant.name}" ya está creado con Google Place ID: ${draftData.restaurantGooglePlaceId}`);
          setSuccessMessage(`El restaurante "${existingRestaurant.name}" ya está creado con Google Place ID: ${draftData.restaurantGooglePlaceId}`);
          return; // Salir de la ejecución de este borrador
        }
  
        // Crear un nuevo documento en "restaurants" con la información del borrador
        const restaurantRef = await addDoc(collection(db, "restaurants"), {
          name: draftData.restaurantName,
          description: draftData.restaurantDescription,
          googlePlaceId: draftData.restaurantGooglePlaceId,
          address: draftData.restaurantDirection,
          phone: draftData.restaurantPhone,
          website: draftData.restaurantWebsite,
          tripadvisorUrl: draftData.restaurantFichaTripadvisor,
          googleMapsUrl: draftData.restaurantFichaGoogleMaps,
          rating: draftData.restaurantRatingGoolgeMaps,
          reviews: draftData.restaurantReviewesGoogleMaps,
          priceLevel: draftData.restaurantPriceLevelGoogleMaps,
          image: draftData.restaurantImage,
          state: draftData.restaurantState,
          latitude: draftData.restaurantLat,
          longitude: draftData.restaurantLon,
          videoId: videoId, // Referenciamos el video
          draftId: doc.id, // Referenciamos el borrador
          createdAt: new Date().toISOString(), // Fecha de creación
        });
  
        // Crear la subcolección "videos" para este restaurante
        const videoRef = collection(restaurantRef, "videos");
        await addDoc(videoRef, {
          platformReviewId: videoData.PlatformReviewId,
          reviewerId: videoData.ReviewerId,
          title: videoData.Title,
          type: videoData.Type,
          publishDate: videoData.publishDate,
        });
      });
  
      // Esperamos a que se completen todas las promesas
      await Promise.all(promises);
  
      // Mostrar mensaje de éxito
      setSuccessMessage(`Información volcada correctamente para los borradores del video con ID: ${videoId}`);
    } catch (error) {
      console.error("Error al volcar la información:", error);
      alert("Ocurrió un error al volcar la información. Por favor, inténtelo de nuevo más tarde.");
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <h1>Edit Videos Page</h1>
        <input
          type="text"
          placeholder="Buscar por título"
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        <div className={styles.pagination}>
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Anterior</button>
          {pageNumbers.map(number => (
            <button key={number} onClick={() => paginate(number)} className={currentPage === number ? styles.active : ''}>
              {number}
            </button>
          ))}
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === pageNumbers.length}>Siguiente</button>
        </div>
        <ul className={styles.reviewersList}>
          <li className={styles.listTitleItem}>
            <div className={styles.nombre}>Título</div>
            <div className={styles.fecha}>Fecha de publicación</div>
          </li>
        </ul>
        <ul className={styles.reviewersList}>
          {currentVideos.map((video, index) => (
            <>
              <li key={video.id} className={styles.reviewerItem}>
                <div className={styles.reviewerName}>{video.Title}</div>
                <div className={styles.reviewerDate}>
                  {new Date(video.publishDate).toISOString().split("T")[0]} {/* Formato YYYY-MM-DD */}
                </div>
                <div className={styles.reviewerButtons}>
                  <button className={styles.viewButton} onClick={() => handleViewClick(video.id)}>👁️ Ver</button>
                  <button className={styles.deleteButton} onClick={() => handleDelete(video.id)}>❌ Eliminar</button>
                </div>
              </li>
              {viewVideoId === video.id && (
                <li key={`view-${index}`} className={styles.viewForm}>
                  <div className={styles.formGroup}>
                    <label>Reviewer</label>
                    <div className={styles.inputWithAvatar}>
                      <input
                        type="text"
                        value={reviewers[video.ReviewerId]?.name || 'Desconocido'}
                        readOnly
                        className={styles.input}
                      />
                      {reviewers[video.ReviewerId]?.avatarUrl && (
                        <img src={reviewers[video.ReviewerId].avatarUrl} alt="Avatar" className={styles.avatarPreview} />
                      )}
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Title</label>
                    <input
                      type="text"
                      value={video.Title}
                      readOnly
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Publish Date</label>
                    <input
                      type="text"
                      value={new Date(video.publishDate).toISOString().split("T")[0]}
                      readOnly
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Transcription</label>
                    <textarea
                      value={video.Transcription || 'No hay transcripción disponible'}
                      readOnly
                      className={styles.textarea}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Video</label>
                    <div className={styles.videoContainer}>
                      <iframe
                        width="560"
                        height="315"
                        src={`https://www.youtube.com/embed/${video.PlatformReviewId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'baseline', alignContent: 'stretch', gap: '10px'}}>
                    <button type="button" className={styles.newReviewButton} onClick={handleNewReviewClick}>Crear review manualmente</button>
                    <button type="button" className={styles.cancelButton} onClick={handleHideClick}>Hide</button>
                  </div>
                  {/* Mostrar borradores asociados */}
                  <h3>Borradores asociados:</h3>
                  <ul className={styles.reviewersList}>
                    <li className={styles.listTitleItem}>
                      <div className={styles.nombre}>Nombre del borrador</div>
                      <div className={styles.acciones}>Acciones</div>
                    </li>
                  </ul>
                  <ul className={styles.reviewersList}>
                    {currentDrafts.length > 0 ? (
                      currentDrafts.map(draft => (
                        <li key={draft.id} className={styles.reviewerItem}>
                          <div className={styles.reviewerName}>{draft.restaurantName}</div>
                          <div className={styles.reviewerActions}>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEditDraft(draft)}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteDraft(draft.id)}
                            >
                              ❌ Eliminar
                            </button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className={styles.noDrafts}>No hay borradores asociados a este video.</li>
                    )}
                  </ul>
                  {/* Paginación para borradores */}
                  <div className={styles.pagination}>
                    <button onClick={() => paginateDrafts(currentDraftPage - 1)} disabled={currentDraftPage === 1}>
                      Anterior
                    </button>
                    {draftPageNumbers.map(number => (
                      <button
                        key={number}
                        onClick={() => paginateDrafts(number)}
                        className={currentDraftPage === number ? styles.active : ''}
                      >
                        {number}
                      </button>
                    ))}
                    <button onClick={() => paginateDrafts(currentDraftPage + 1)} disabled={currentDraftPage === draftPageNumbers.length}>
                      Siguiente
                    </button>
                  </div>

                  {newReviewFormVisible && (
                    <form className={styles.newReviewForm}>
                      <div className={styles.formGroup}>
                        <label>Segundo de inicio</label>
                        <input
                          type="number"
                          name="startSecond"
                          value={newReviewFormData.startSecond}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Descripción del restaurante</label>
                        <input
                          type="text"
                          name="restaurantDescription"
                          value={newReviewFormData.restaurantDescription}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSearchPlaces(newReviewFormData.restaurantDescription)}
                        className={styles.formButton}
                      >
                        Obtenir GooglePlace ID
                      </button>
                      {places.length > 0 && (
                        <div className={styles.dropdown}>
                          <label>Selecciona un lugar:</label>
                          <select
                            onChange={(e) => handlePlaceSelection(e.target.value)} // Actualizar el Place ID seleccionado
                            className={styles.dropdownSelect}
                          >
                            <option value="">Selecciona un lugar</option>
                            {places.map((place, index) => (
                              <option key={place.id || index} value={place.id || ""}>
                                {place.displayName?.text 
                                  ? `${place.displayName.text} - ${place.formattedAddress || "Sin dirección"}`
                                  : "Sin nombre"}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className={styles.formGroup}>
                        <label>Google Place ID</label>
                        <input
                          type="text"
                          name="restaurantGooglePlaceId"
                          value={newReviewFormData.restaurantGooglePlaceId}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                        <button
                          type="button"
                          onClick={() => handleSearchGooglePlaceId(newReviewFormData.restaurantGooglePlaceId)}
                          className={styles.formButton}
                        >
                          Obtenir dades de GooglePlace ID
                        </button>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Nombre del restaurante</label>
                        <input
                          type="text"
                          name="restaurantName"
                          value={newReviewFormData.restaurantName}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Dirección</label>
                        <input
                          type="text"
                          name="restaurantDirection"
                          value={newReviewFormData.restaurantDirection}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Teléfono</label>
                        <input
                          type="text"
                          name="restaurantPhone"
                          value={newReviewFormData.restaurantPhone}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Sitio web</label>
                        <input
                          type="text"
                          name="restaurantWebsite"
                          value={newReviewFormData.restaurantWebsite}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Ficha Tripadvisor</label>
                        <input
                          type="text"
                          name="restaurantFichaTripadvisor"
                          value={newReviewFormData.restaurantFichaTripadvisor}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Ficha Google Maps</label>
                        <input
                          type="text"
                          name="restaurantFichaGoogleMaps"
                          value={newReviewFormData.restaurantFichaGoogleMaps}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Rating Google Maps</label>
                        <input
                          type="text"
                          name="restaurantRatingGoolgeMaps"
                          value={newReviewFormData.restaurantRatingGoolgeMaps}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Reviews Google Maps</label>
                        <input
                          type="text"
                          name="restaurantReviewesGoogleMaps"
                          value={newReviewFormData.restaurantReviewesGoogleMaps}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Precio Google Maps</label>
                        <input
                          type="text"
                          name="restaurantPriceLevelGoogleMaps"
                          value={newReviewFormData.restaurantPriceLevelGoogleMaps}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Latitud</label>
                        <input
                          type="text"
                          name="lat"
                          value={newReviewFormData.lat}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Longitud</label>
                        <input
                          type="text"
                          name="lon"
                          value={newReviewFormData.lon}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Mapa</label>
                        <MapComponent lat={parseFloat(newReviewFormData.lat)} lon={parseFloat(newReviewFormData.lon)} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Imagen</label>
                        <input
                          type="text"
                          name="restaurantImage"
                          value={newReviewFormData.restaurantImage}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                        {/* Mostrar la vista previa de la imagen si la URL no está vacía */}
                        {newReviewFormData.restaurantImage && (
                          <div className={styles.imagePreviewContainer}>
                            <img
                              src={newReviewFormData.restaurantImage}
                              alt="Vista previa de la imagen"
                              className={styles.imagePreview}
                              onError={(e) => {
                                e.target.style.display = 'none'; // Ocultar la imagen si no es válida
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Estado</label>
                        <input
                          type="text"
                          name="restaurantState"
                          value={newReviewFormData.restaurantState}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formButtonGroup}>
                        {isCreatingDraft && (
                          <button
                            type="button"
                            className={styles.submitButton}
                            onClick={handleSaveAsBorrador}
                          >
                            Guardar borrador
                          </button>
                        )}
                        {isEditingDraft && (
                          <button
                            type="button"
                            className={styles.submitButton}
                            onClick={handleSaveEditedDraft}
                          >
                            Guardar cambios
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.cancelButton}
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </button>
                        </div>
                    </form>
                    
                  )}
                  {/* Botón "Volcar información" añadido debajo del todo */}
                  <div className={styles.formButtonGroup}>
                    <button
                      type="button"
                      className={styles.submitButton}
                      onClick={() => volcarInfo(video.id)}
                    >
                      Volcar información
                    </button>
                  </div>
                </li>
              )}
            </>
          ))}
        </ul>
        {showPopup && (
          <div className={styles.popupOverlay}>
            <div className={styles.popup}>
              <p>¿Estás seguro de que quieres realizar esta acción?</p>
              <button className={styles.confirmButton} onClick={handleConfirmAction}>Confirmar</button>
              <button className={styles.cancelButton} onClick={hidePopup}>Cancelar</button>
            </div>
          </div>
        )}
        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
      </div>
    </div>
  );
}

export default EditVideos;