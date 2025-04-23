"use client";

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import styles from '../page.module.css';
import { db } from '../FirebaseConfig.js';
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { searchPlaces, getPlaceDetails } from '../../utils/googlePlacesService.js';

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
  };

  const handleHideClick = () => {
    setViewVideoId(null);
  };

  const handleNewReviewClick = () => {
    setNewReviewFormVisible(!newReviewFormVisible);
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
  
    newReviewFormData.restaurantName = details.displayName?.text || "";  // Verifica si existe 'displayName'
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
                        <label>Imagen</label>
                        <input
                          type="text"
                          name="restaurantImage"
                          value={newReviewFormData.restaurantImage}
                          onChange={handleNewReviewFormChange}
                          className={styles.input}
                        />
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
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={handleNewReviewClick}
                      >
                        Cancelar
                      </button>
                    </form>
                  )}
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