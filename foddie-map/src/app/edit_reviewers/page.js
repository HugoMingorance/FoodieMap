"use client";

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import styles from '../page.module.css';
import { app, db } from '../FirebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import apiKeys from '../../utils/apiKeys';

const EditReviewers = () => {
  const [formData, setFormData] = useState({
    avatarUrl: '',
    lastVideoChecked: '',
    name: '',
    web: '',
    channelId: ''
  });

  const [editFormData, setEditFormData] = useState({
    avatarUrl: '',
    lastVideoChecked: '',
    name: '',
    web: '',
    channelId: ''
  });

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [editAvatarPreviewUrl, setEditAvatarPreviewUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(null); // Estado para controlar el formulario de edición
  const [viewReviewerId, setViewReviewerId] = useState(null); // Estado para controlar el formulario de visualización
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewers, setReviewers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewersPerPage] = useState(2);
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);

  useEffect(() => {
    fetchReviewers();
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      isSupported().then((supported) => {
        if (supported) {
          getAnalytics(app);
        }
      });
    }
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (name === 'avatarUrl') {
      setAvatarPreviewUrl(value);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
    if (name === 'avatarUrl') {
      setEditAvatarPreviewUrl(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "Reviewers"), {
        AvatarURL: formData.avatarUrl,
        LastVideoIDChecked: formData.lastVideoChecked,
        Name: formData.name,
        Web: formData.web,
        ChannelID: formData.channelId,
        createdAt: new Date() // Añadir la fecha de creación
      });
      console.log("Document written with ID: ", docRef.id);
      // Vaciar los inputs del formulario
      setFormData({
        avatarUrl: '',
        lastVideoChecked: '',
        name: '',
        web: '',
        channelId: ''
      });
      setAvatarPreviewUrl('');
      setSuccessMessage('Se ha añadido correctamente');
      fetchReviewers(); // Actualizar la lista de reviewers después de añadir uno nuevo
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    showPopupWithAction(async () => {
      try {
        const reviewerDoc = doc(db, "Reviewers", showEditForm);
        await updateDoc(reviewerDoc, {
          AvatarURL: editFormData.avatarUrl,
          LastVideoIDChecked: editFormData.lastVideoChecked,
          Name: editFormData.name,
          Web: editFormData.web,
          ChannelID: editFormData.channelId
        });
        setShowEditForm(null);
        setEditAvatarPreviewUrl('');
        setSuccessMessage('Se ha editado correctamente');
        fetchReviewers(); // Actualizar la lista de reviewers después de la edición
      } catch (e) {
        console.error("Error updating document: ", e);
      }
    });
  };

  const handleDelete = (reviewerId) => {
    showPopupWithAction(async () => {
      try {
        await deleteDoc(doc(db, "Reviewers", reviewerId));
        setSuccessMessage('Se ha eliminado correctamente');
        fetchReviewers(); // Actualizar la lista de reviewers después de eliminar uno
      } catch (e) {
        console.error("Error deleting document: ", e);
      }
    });
  };

  const handleAddNewClick = () => {
    setShowForm(!showForm);
  };

  const handleViewClick = (reviewerId) => {
    setViewReviewerId(reviewerId);
  };

  const handleEditClick = (reviewer) => {
    setEditFormData({
      avatarUrl: reviewer.AvatarURL,
      lastVideoChecked: reviewer.LastVideoIDChecked,
      name: reviewer.Name,
      web: reviewer.Web,
      channelId: reviewer.ChannelID
    });
    setEditAvatarPreviewUrl(reviewer.AvatarURL);
    setShowEditForm(reviewer.id);
  };

  const handleCancelEdit = () => {
    showPopupWithAction(() => {
      setShowEditForm(null);
      setEditAvatarPreviewUrl('');
    });
  };

  const handleHideClick = () => {
    setViewReviewerId(null);
  };

  const handleVisitWeb = () => {
    if (formData.web) {
      window.open(formData.web, '_blank');
    }
  };

  const handleEditVisitWeb = () => {
    if (editFormData.web) {
      window.open(editFormData.web, '_blank');
    }
  };

  const getChannelId = async (url) => {
    try {
      // Extraer el nombre de usuario o ID del canal de la URL
      const matches = url.match(/\/@([^\/]+)\/?/);
      const username = matches ? matches[1] : url;
  
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${apiKeys.YOUTUBE_API_KEY}`);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].id.channelId;
      } else {
        console.error('No se encontró el canal' + ' ' + username + ' ' + apiKeys.YOUTUBE_API_KEY + ' ' + `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${apiKeys.YOUTUBE_API_KEY}`);
        return null;
      }
    } catch (error) {
      console.error('Error al obtener el Channel ID:', error);
      return null;
    }
  };

  const handleGetChannelId = async () => {
    const channelId = await getChannelId(formData.web);
    if (channelId) {
      setFormData({
        ...formData,
        channelId,
      });
    }
  };

  const handleEditGetChannelId = async () => {
    const channelId = await getChannelId(editFormData.web);
    if (channelId) {
      setEditFormData({
        ...editFormData,
        channelId,
      });
    }
  };

  const fetchReviewers = async () => {
    const q = searchQuery
      ? query(collection(db, "Reviewers"), where("Name", ">=", searchQuery), where("Name", "<=", searchQuery + '\uf8ff'))
      : collection(db, "Reviewers");
    const querySnapshot = await getDocs(q);
    const reviewersList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    reviewersList.sort((a, b) => b.createdAt - a.createdAt); // Ordenar los reviewers por fecha de creación
    setReviewers(reviewersList);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Resetear a la primera página cuando se realiza una nueva búsqueda
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Obtener los reviewers actuales
  const indexOfLastReviewer = currentPage * reviewersPerPage;
  const indexOfFirstReviewer = indexOfLastReviewer - reviewersPerPage;
  const currentReviewers = reviewers.slice(indexOfFirstReviewer, indexOfLastReviewer);

  // Calcular el número total de páginas
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(reviewers.length / reviewersPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <h1>Edit Reviewers Page</h1>
        <button onClick={handleAddNewClick} className={styles.addButton}>
          {showForm ? 'Cancelar' : 'Añadir nueva entrada'}
        </button>
        {showForm && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="avatarUrl">URL del Avatar</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="avatarUrl"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleChange}
                  className={styles.input}
                />
                {avatarPreviewUrl && <img src={avatarPreviewUrl} alt="Avatar Preview" className={styles.avatarPreview} />}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastVideoChecked">Last Video Checked</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="lastVideoChecked"
                  name="lastVideoChecked"
                  value={formData.lastVideoChecked}
                  onChange={handleChange}
                  className={styles.input}
                />
                <button type="button" className={styles.formButton}>Cargar últimos videos</button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="web">Web</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="web"
                  name="web"
                  value={formData.web}
                  onChange={handleChange}
                  className={styles.input}
                />
                <button type="button" className={styles.formButton} onClick={handleVisitWeb}>Visitar web</button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="channelId">Channel ID</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="channelId"
                  name="channelId"
                  value={formData.channelId}
                  onChange={handleChange}
                  className={styles.input}
                />
                <button type="button" className={styles.formButton} onClick={handleGetChannelId}>Obtener ChannelID</button>
              </div>
            </div>
            <button type="submit" className={styles.submitButton}>Crear nuevo Reviewer</button>
            {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
          </form>
        )}
        {showEditForm && (
          <form onSubmit={handleEditSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="avatarUrl">URL del Avatar</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="avatarUrl"
                  name="avatarUrl"
                  value={editFormData.avatarUrl}
                  onChange={handleEditChange}
                  className={styles.input}
                />
                {editAvatarPreviewUrl && <img src={editAvatarPreviewUrl} alt="Avatar Preview" className={styles.avatarPreview} />}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastVideoChecked">Last Video Checked</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="lastVideoChecked"
                  name="lastVideoChecked"
                  value={editFormData.lastVideoChecked}
                  onChange={handleEditChange}
                  className={styles.input}
                />
                <button type="button" className={styles.formButton}>Cargar últimos videos</button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editFormData.name}
                onChange={handleEditChange}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="web">Web</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="web"
                  name="web"
                  value={editFormData.web}
                  onChange={handleEditChange}
                  className={styles.input}
                />
                <button type="button" className={styles.formButton} onClick={handleEditVisitWeb}>Visitar web</button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="channelId">Channel ID</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="channelId"
                  name="channelId"
                  value={editFormData.channelId}
                  onChange={handleEditChange}
                  className={styles.input}
                />
                <button type="button" className={styles.formButton} onClick={handleEditGetChannelId}>Obtener ChannelID</button>
              </div>
            </div>
            <button type="submit" className={styles.submitButton}>Actualizar</button>
            <button type="button" className={styles.cancelButton} onClick={handleCancelEdit}>Cancelar</button>
          </form>
        )}
        <div>
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
          <div className={styles.pagination}>
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
            {pageNumbers.map(number => (
              <button key={number} onClick={() => paginate(number)} className={currentPage === number ? styles.active : ''}>
                {number}
              </button>
            ))}
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === pageNumbers.length}>Next</button>
          </div>
          <ul className={styles.reviewersList}>
            <li className={styles.listTitleItem}>
              <div className={styles.nombre}>Nombre</div>
              <div className={styles.fecha}>Fecha de creación</div>
            </li>
          </ul>
          <ul className={styles.reviewersList}>
            {currentReviewers.map((reviewer, index) => (
              <>
                <li key={index} className={styles.reviewerItem}>
                  <div className={styles.reviewerName}>{reviewer.Name}</div>
                  <div className={styles.reviewerDate}>{new Date(reviewer.createdAt.seconds * 1000).toLocaleString()}</div>
                  <div className={styles.reviewerButtons}>
                    <button className={styles.viewButton} onClick={() => handleViewClick(reviewer.id)}>👁️ Ver</button>
                    <button className={styles.editButton} onClick={() => handleEditClick(reviewer)}>✏️ Editar</button>
                    <button className={styles.deleteButton} onClick={() => handleDelete(reviewer.id)}>❌ Eliminar</button>                  
                  </div>
                </li>
                {viewReviewerId === reviewer.id && (
                  <li key={`view-${index}`} className={styles.viewForm}>
                    <div className={styles.formGroup}>
                      <label>URL del Avatar</label>
                      <div className={styles.inputWithAvatar}>
                        <input
                          type="text"
                          value={reviewer.AvatarURL}
                          readOnly
                          className={styles.input}
                        />
                        <img src={reviewer.AvatarURL} alt="Avatar Preview" className={styles.avatarPreview} />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Last Video Checked</label>
                      <input
                        type="text"
                        value={reviewer.LastVideoIDChecked}
                        readOnly
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Name</label>
                      <input
                        type="text"
                        value={reviewer.Name}
                        readOnly
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Web</label>
                      <input
                        type="text"
                        value={reviewer.Web}
                        readOnly
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Channel ID</label>
                      <input
                        type="text"
                        value={reviewer.ChannelID}
                        readOnly
                        className={styles.input}
                      />
                    </div>
                    <button type="button" className={styles.cancelButton} onClick={handleHideClick}>Hide</button>
                  </li>
                )}
              </>
            ))}
          </ul>
        </div>
      </div>
      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <p>¿Estás seguro de que quieres realizar esta acción?</p>
            <button className={styles.confirmButton} onClick={handleConfirmAction}>Confirmar</button>
            <button className={styles.cancelButton} onClick={hidePopup}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditReviewers;