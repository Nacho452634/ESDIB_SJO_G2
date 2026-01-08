document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const authContainer = document.getElementById('authContainer');
    const userProfile = document.getElementById('userProfile');
    const logoutBtn = document.getElementById('logoutBtn');
    const usernameDisplay = document.getElementById('usernameDisplay');

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        showProfile();
    } else {
        showAuth();
    }

    // Toggle forms
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                showProfile();
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error al conectar con el servidor');
        }
    });

    // Register Logic
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = registerForm.username.value;
        const password = registerForm.password.value;

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                alert('Usuario creado con éxito. Por favor, inicia sesión.');
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error al conectar con el servidor');
        }
    });

    // Logout Logic
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        showAuth();
    });

    async function showProfile() {
        authContainer.style.display = 'none';
        userProfile.style.display = 'block';
        usernameDisplay.textContent = localStorage.getItem('username');

        // Cargar Favoritos
        const favContainer = document.getElementById('favoritesContainer');
        if (favContainer) {
            favContainer.innerHTML = '<p style="color: #777; font-size: 14px;">Cargando favoritos...</p>';

            try {
                const res = await fetch('/api/pets');
                const pets = await res.json();

                favContainer.innerHTML = '';
                let hasFavs = false;

                pets.forEach(pet => {
                    const likeKey = `like-${pet._id}`;
                    if (localStorage.getItem(likeKey) === 'true') {
                        hasFavs = true;
                        const div = document.createElement('a');
                        div.href = `adopciones.html#modal-${pet._id}`;
                        div.className = 'fav-card';
                        div.innerHTML = `
              <img src="/api/image/${pet.imageId}" alt="${pet.nombre}">
              <div class="fav-info">
                <h4>${pet.nombre}</h4>
              </div>
            `;
                        favContainer.appendChild(div);
                    }
                });

                if (!hasFavs) {
                    favContainer.innerHTML = '<p style="color: #777; font-size: 14px;">Aún no tienes favoritos.</p>';
                }

            } catch (err) {
                console.error(err);
                favContainer.innerHTML = '<p style="color: red; font-size: 14px;">Error al cargar favoritos.</p>';
            }
        }
    }

    function showAuth() {
        authContainer.style.display = 'block';
        userProfile.style.display = 'none';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginForm.reset();
        registerForm.reset();
    }
});
