// CARGAR MASCOTAS
async function cargarMascotas() {
  const res = await fetch("/api/pets");
  const pets = await res.json();

  const cont = document.getElementById("petsContainer");
  cont.innerHTML = "";

  pets.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
            <img src="/api/image/${p.imageId}">
            <div class="card-info">
                <h3>${p.nombre}</h3>
                <p>${p.raza}</p>
                <p>${p.genero} • ${p.edad}</p>

                <button onclick="verMascota('${p._id}')">Ver</button>
                <button onclick="editarMascota('${p._id}')">Editar</button>
                <button onclick="eliminarMascota('${p._id}')">Eliminar</button>
            </div>
        `;
    cont.appendChild(div);
  });
}

cargarMascotas();

// FORM PARA SUBIR
document.getElementById("petForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);

  // Cambiamos 'imagen' a 'image' para que coincida con server.js
  if (fd.has("imagen")) {
    fd.set("image", fd.get("imagen"));
    fd.delete("imagen");
  }

  await fetch("/api/pets", {
    method: "POST",
    body: fd
  });

  e.target.reset();
  cargarMascotas();
});

// VER MASCOTA
async function verMascota(id) {
  const pets = await fetch("/api/pets").then(r => r.json());
  const p = pets.find(x => x._id === id);

  document.getElementById("modalImg").src = "/api/image/" + p.imageId;
  document.getElementById("modalNombre").innerText = p.nombre;
  document.getElementById("modalInfo").innerText = `${p.raza} • ${p.genero} • ${p.edad}`;
  document.getElementById("modalDesc").innerText = p.descripcion;

  document.getElementById("modalBg").style.display = "flex";
}

document.getElementById("closeModal").onclick = () => {
  document.getElementById("modalBg").style.display = "none";
};

// EDITAR
async function editarMascota(id) {
  const datos = prompt("Introduce los datos así:\nNombre, Raza, Edad, Género, Descripción");
  if (!datos) return;

  const [nombre, raza, edad, genero, descripcion] = datos.split(",");

  await fetch(`/api/pets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, raza, edad, genero, descripcion })
  });

  cargarMascotas();
}

// ELIMINAR
async function eliminarMascota(id) {
  if (!confirm("¿Seguro?")) return;

  await fetch(`/api/pets/${id}`, { method: "DELETE" });
  cargarMascotas();
}
