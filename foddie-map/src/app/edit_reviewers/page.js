"use client";

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import styles from '../page.module.css';

const EditReviewers = () => {
  const [formData, setFormData] = useState({
    avatarUrl: '',
    lastVideoChecked: '',
    name: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes manejar el envío del formulario
    console.log('Form Data:', formData);
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        <h1>Edit Reviewers Page</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="avatarUrl">URL del Avatar</label>
            <input
              type="text"
              id="avatarUrl"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="lastVideoChecked">Last Video Checked</label>
            <input
              type="text"
              id="lastVideoChecked"
              name="lastVideoChecked"
              value={formData.lastVideoChecked}
              onChange={handleChange}
              className={styles.input}
            />
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
          <button type="submit" className={styles.submitButton}>Submit</button>
        </form>
      </div>
    </div>
  );
}

export default EditReviewers;