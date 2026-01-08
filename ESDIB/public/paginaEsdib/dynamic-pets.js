document.addEventListener('DOMContentLoaded', async () => {
  // 1. Manejar "Me gusta" para mascotas estáticas (ya en el HTML)
  const staticCheckboxes = document.querySelectorAll('.like-checkbox');
  staticCheckboxes.forEach(cb => {
    // Cargar estado guardado
    if (localStorage.getItem(cb.id) === 'true') {
      cb.checked = true;
    }
    // Guardar al cambiar
    cb.addEventListener('change', (e) => {
      localStorage.setItem(e.target.id, e.target.checked);
    });
  });

  // 2. Cargar mascotas del Backend
  const container = document.querySelector('.cards-container');

  try {
    const res = await fetch('/api/pets');
    if (!res.ok) throw new Error('Error al obtener mascotas');
    const pets = await res.json();

    pets.forEach(pet => {
      // Generar IDs únicos
      const modalId = `modal-${pet._id}`;
      const likeId = `like-${pet._id}`;
      const imageUrl = `/api/image/${pet.imageId}`;

      // Verificar si ya le dimos like antes
      const isLiked = localStorage.getItem(likeId) === 'true' ? 'checked' : '';

      // Crear HTML de la tarjeta
      const card = document.createElement('div');
      card.className = 'pet-card';
      card.innerHTML = `
        <a href="#${modalId}" class="card-link"></a>
        <img src="${imageUrl}" alt="${pet.nombre}">
        <div class="info">
          <h3>${pet.nombre}</h3>
          <p class="breed">${pet.raza || 'Desconocida'}</p>
          <p class="details">${pet.genero || ''}, ${pet.edad || ''}</p>
        </div>
        <input type="checkbox" id="${likeId}" class="like-checkbox" ${isLiked}>
        <label for="${likeId}" class="like-btn">♥</label>
      `;
      container.appendChild(card);

      // Añadir listener al checkbox recién creado
      const checkbox = card.querySelector(`#${likeId}`);
      checkbox.addEventListener('change', (e) => {
        localStorage.setItem(likeId, e.target.checked);
      });

      // Crear HTML del Modal
      const modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-box">
          <a href="#" class="close-btn">✕</a>
          <img src="${imageUrl}" class="modal-img" alt="${pet.nombre}">
          <div class="modal-content">
            <div class="modal-header">
              <h2>${pet.nombre}</h2>
            </div>
            <p class="pet-info">${pet.raza || ''} • ${pet.genero || ''} • ${pet.edad || ''}</p>
            <p class="modal-description">
              ${pet.descripcion || 'Sin descripción disponible.'}
            </p>
            <a href="#" class="adopt-btn">ADOPTAR</a>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    });

    // 3. Lógica de Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.pet-card');

        cards.forEach(card => {
          const name = card.querySelector('h3').textContent.toLowerCase();
          const breed = card.querySelector('.breed').textContent.toLowerCase();

          if (name.includes(term) || breed.includes(term)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    }

  } catch (error) {
    console.error('Error cargando mascotas dinámicas:', error);
  }
});
