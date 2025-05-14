"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import styles from "../page.module.css";
import { db } from "../FirebaseConfig.js";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import MapComponent from "../components/MapComponent";

const EditRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [restaurantsPerPage] = useState(5); // Número de restaurantes por página
  const [viewRestaurantId, setViewRestaurantId] = useState(null); // Controlar el restaurante expandido
  const [reviews, setReviews] = useState([]); // Reviews asociados al restaurante
  const [currentReviewPage, setCurrentReviewPage] = useState(1); // Paginación para los reviews
  const [reviewsPerPage] = useState(1); // Número de reviews por página
  const [viewReviewId, setViewReviewId] = useState(null); // Controlar el review expandido
  const [reviewers, setReviewers] = useState({}); // Información de los reviewers
  const [editableRestaurant, setEditableRestaurant] = useState(null);

  useEffect(() => {
    fetchRestaurants();
    fetchReviewers();
  }, [searchQuery]);

  // Obtener restaurantes de Firestore
  const fetchRestaurants = async () => {
    const q = searchQuery
      ? query(collection(db, "restaurants"), where("name", ">=", searchQuery), where("name", "<=", searchQuery + "\uf8ff"))
      : collection(db, "restaurants");
    const querySnapshot = await getDocs(q);
    const restaurantsList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setRestaurants(restaurantsList);
  };

  // Obtener información de los reviewers
  const fetchReviewers = async () => {
    const reviewersRef = collection(db, "Reviewers");
    const querySnapshot = await getDocs(reviewersRef);
    const reviewersData = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reviewersData[data.ChannelID] = data.Name;
    });
    setReviewers(reviewersData);
  };

  // Obtener reviews asociados al restaurante
  const fetchReviews = async (restaurantId) => {
    const reviewsRef = collection(db, "restaurants", restaurantId, "videos");
    const querySnapshot = await getDocs(reviewsRef);
    const reviewsList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setReviews(reviewsList);
  };

  // Manejar cambios en el cuadro de búsqueda
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reiniciar a la primera página
  };

  const handleViewClick = (restaurantId) => {
    const selected = restaurants.find(r => r.id === restaurantId);
    setEditableRestaurant({ ...selected }); // Copia editable
    setViewRestaurantId(restaurantId);
    fetchReviews(restaurantId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableRestaurant((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSaveChanges = async () => {
    if (!editableRestaurant) return;
    try {
      const docRef = doc(db, "restaurants", editableRestaurant.id);
      const dataToUpdate = { ...editableRestaurant };
      delete dataToUpdate.id; // Firestore no acepta campo id

      await updateDoc(docRef, dataToUpdate);
      alert("Datos del restaurante actualizados correctamente.");
      fetchRestaurants(); // Refrescar la lista
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert("Error al guardar los cambios.");
    }
  };

  // Cerrar el detalle del restaurante
  const handleHideClick = () => {
    setViewRestaurantId(null);
  };

  // Manejar la visualización de detalles del review
  const handleReviewViewClick = (reviewId) => {
    setViewReviewId((prevId) => (prevId === reviewId ? null : reviewId)); // Alternar entre mostrar y ocultar
  };

  // Helpers para la paginación de restaurantes
  const indexOfLastRestaurant = currentPage * restaurantsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
  const currentRestaurants = restaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant);
  const restaurantPageNumbers = [];
  for (let i = 1; i <= Math.ceil(restaurants.length / restaurantsPerPage); i++) {
    restaurantPageNumbers.push(i);
  }
  const paginateRestaurants = (pageNumber) => setCurrentPage(pageNumber);

  // Helpers para la paginación de reviews
  const indexOfLastReview = currentReviewPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const reviewPageNumbers = [];
  for (let i = 1; i <= Math.ceil(reviews.length / reviewsPerPage); i++) {
    reviewPageNumbers.push(i);
  }
  const paginateReviews = (pageNumber) => setCurrentReviewPage(pageNumber);

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <h1>Edit Restaurants Page</h1>
        <input
          type="text"
          placeholder="Buscar restaurantes por nombre"
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        <div className={styles.pagination}>
          <button onClick={() => paginateRestaurants(currentPage - 1)} disabled={currentPage === 1}>
            Anterior
          </button>
          {restaurantPageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => paginateRestaurants(number)}
              className={currentPage === number ? styles.active : ""}
            >
              {number}
            </button>
          ))}
          <button onClick={() => paginateRestaurants(currentPage + 1)} disabled={currentPage === restaurantPageNumbers.length}>
            Siguiente
          </button>
        </div>
        <ul className={styles.reviewersList}>
          <li className={styles.listTitleItem}>
            <div className={styles.nombre}>Nombre del restaurante</div>
            <div className={styles.nombre}>Dirección</div>
          </li>
          {currentRestaurants.map((restaurant) => (
            <>
              <li key={restaurant.id} className={styles.reviewerItem}>
                <div className={styles.reviewerName}>{restaurant.name}</div>
                <div className={styles.reviewerName}>{restaurant.address}</div>
                <div className={styles.reviewerButtons}>
                  <button className={styles.viewButton} onClick={() => handleViewClick(restaurant.id)}>
                    👁️ Ver
                  </button>
                </div>
              </li>
              {viewRestaurantId === restaurant.id && (
                <li key={`view-${restaurant.id}`} className={styles.viewForm}>
                  <div className={styles.formGroup}>
                    <label>Segundo de inicio</label>
                    <input
                      type="text"
                      name="startSecond"
                      value={editableRestaurant?.startSecond || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Descripción</label>
                    <input
                      type="text"
                      name="description"
                      value={editableRestaurant?.description || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Google Place ID</label>
                    <input
                      type="text"
                      name="googlePlaceId"
                      value={editableRestaurant?.googlePlaceId || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nombre del restaurante</label>
                    <input
                      type="text"
                      name="name"
                      value={editableRestaurant?.name || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Dirección</label>
                    <input
                      type="text"
                      name="address"
                      value={editableRestaurant?.address || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Teléfono</label>
                    <input
                      type="text"
                      name="phone"
                      value={editableRestaurant?.phone || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Sitio web</label>
                    <input
                      type="text"
                      name="website"
                      value={editableRestaurant?.website || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Ficha Tripadvisor</label>
                    <input
                      type="text"
                      name="tripadvisorUrl"
                      value={editableRestaurant?.tripadvisorUrl || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Ficha Google Maps</label>
                    <input
                      type="text"
                      name="googleMapsUrl"
                      value={editableRestaurant?.googleMapsUrl || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Rating</label>
                    <input
                      type="text"
                      name="rating"
                      value={editableRestaurant?.rating || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Reviews Google Maps</label>
                    <input
                      type="text"
                      name="reviews"
                      value={editableRestaurant?.reviews || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Precio estimado</label>
                    <input
                      type="text"
                      name="priceLevel"
                      value={editableRestaurant?.priceLevel || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Latitude</label>
                    <input
                      type="text"
                      name="latitude"
                      value={editableRestaurant?.latitude || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Longitude</label>
                    <input
                      type="text"
                      name="longitude"
                      value={editableRestaurant?.longitude || ""}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mapa</label>
                    <MapComponent
                      lat={parseFloat(editableRestaurant?.latitude || 0)}
                      lon={parseFloat(editableRestaurant?.longitude || 0)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Imagen del restaurante</label>
                    <img
                      src={editableRestaurant?.image || ""}
                      alt="Imagen del restaurante"
                      className={styles.imagePreview}
                    />
                  </div>

                  <button className={styles.submitButton} onClick={handleSaveChanges}>
                    💾 Guardar cambios
                  </button>
                  <h3>Reviews</h3>
                  <ul className={styles.reviewersList}>
                    <li className={styles.listTitleItem}>
                      <div className={styles.nombre}>Nombre del review</div>
                      <div className={styles.acciones}>Acciones</div>
                    </li>
                    {currentReviews.map((review) => (
                      <>
                        <li key={review.id} className={styles.reviewerItem}>
                          <div className={styles.reviewerName}>{review.title}</div>
                          <div className={styles.reviewerActions}>
                            <button className={styles.viewButton} onClick={() => handleReviewViewClick(review.id)}>
                              👁️ Ver
                            </button>
                          </div>
                        </li>
                        {viewReviewId === review.id && (
                          <li key={`view-${review.id}`} className={styles.viewForm}>
                            <div className={styles.formGroup}>
                              <label>Título</label>
                              <input type="text" value={review.title} readOnly className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Reviewer</label>
                              <input
                                type="text"
                                value={reviewers[review.reviewerId] || "Desconocido"}
                                readOnly
                                className={styles.input}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Fecha de publicación</label>
                              <input
                                type="text"
                                value={new Date(review.publishDate).toISOString().split("T")[0]}
                                readOnly
                                className={styles.input}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Video</label>
                              <iframe
                                width="560"
                                height="315"
                                src={`https://www.youtube.com/embed/${review.platformReviewId}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                            <button className={styles.cancelButton} onClick={() => handleReviewViewClick(review.id)}>
                              Cerrar
                            </button>
                          </li>
                        )}
                      </>
                    ))}
                  </ul>
                  {/* Paginación para reviews */}
                  <div className={styles.pagination}>
                    <button onClick={() => paginateReviews(currentReviewPage - 1)} disabled={currentReviewPage === 1}>
                      Anterior
                    </button>
                    {reviewPageNumbers.map((number) => (
                      <button
                        key={number}
                        onClick={() => paginateReviews(number)}
                        className={currentReviewPage === number ? styles.active : ""}
                      >
                        {number}
                      </button>
                    ))}
                    <button onClick={() => paginateReviews(currentReviewPage + 1)} disabled={currentReviewPage === reviewPageNumbers.length}>
                      Siguiente
                    </button>
                  </div>
                  <button className={styles.cancelButton} onClick={handleHideClick}>
                    Cerrar
                  </button>
                </li>
              )}
            </>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EditRestaurants;