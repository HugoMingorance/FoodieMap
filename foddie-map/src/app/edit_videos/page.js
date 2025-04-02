"use client";

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import styles from '../page.module.css';
import { db } from '../FirebaseConfig.js';
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";

const EditVideos = () => {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(10); // Número de vídeos per pàgina
  const [successMessage, setSuccessMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const [viewVideoId, setViewVideoId] = useState(null); // Estado para controlar el formulario de visualización

  useEffect(() => {
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
                  <button className={styles.editButton}>✏️ Editar</button>
                  <button className={styles.deleteButton} onClick={() => handleDelete(video.id)}>❌ Eliminar</button>
                </div>
              </li>
              {viewVideoId === video.id && (
                <li key={`view-${index}`} className={styles.viewForm}>
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
                    <label>Platform Review ID</label>
                    <input
                      type="text"
                      value={video.PlatformReviewId}
                      readOnly
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Reviewer ID</label>
                    <input
                      type="text"
                      value={video.ReviewerId}
                      readOnly
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Type</label>
                    <input
                      type="text"
                      value={video.Type}
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
                  <button type="button" className={styles.cancelButton} onClick={handleHideClick}>Hide</button>
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