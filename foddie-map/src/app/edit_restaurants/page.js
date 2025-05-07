"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import styles from "../page.module.css";
import { db } from "../FirebaseConfig.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import MapComponent from "../components/MapComponent"; 

const EditRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [restaurantsPerPage] = useState(5); // Número de restaurantes por página
  const [viewRestaurantId, setViewRestaurantId] = useState(null); // Controlar el restaurante expandido
  const [reviews, setReviews] = useState([]); // Reviews asociados al restaurante
  const [currentReviewPage, setCurrentReviewPage] = useState(1); // Paginación para los reviews
  const [reviewsPerPage] = useState(5); // Número de reviews por página
  const [viewReviewId, setViewReviewId] = useState(null); // Controlar el review expandido

  useEffect(() => {
    fetchRestaurants();
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

  // Manejar la visualización de detalles del restaurante
  const handleViewClick = (restaurantId) => {
    setViewRestaurantId(restaurantId);
    fetchReviews(restaurantId); // Cargar reviews asociados
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
                    <label>Nombre del restaurante</label>
                    <input type="text" value={restaurant.name} readOnly className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Dirección</label>
                    <input type="text" value={restaurant.address} readOnly className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Teléfono</label>
                    <input type="text" value={restaurant.phone || "No disponible"} readOnly className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Sitio web</label>
                    <input type="text" value={restaurant.website || "No disponible"} readOnly className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Rating</label>
                    <input type="text" value={restaurant.rating || "No disponible"} readOnly className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Precio estimado</label>
                    <input type="text" value={restaurant.priceLevel || "No disponible"} readOnly className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mapa</label>
                    <MapComponent lat={parseFloat(restaurant.latitude)} lon={parseFloat(restaurant.longitude)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Imagen del restaurante</label>
                    <img src={restaurant.image} alt="Imagen del restaurante" className={styles.imagePreview} />
                  </div>
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