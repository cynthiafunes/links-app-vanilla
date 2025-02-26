const API_URL = 'http://localhost:3000';

// Navigation control variable
let currentPage = 'home';

// DOM elements
const contentDiv = document.getElementById('content');
const homeBtn = document.getElementById('home-btn');
const addLinkBtn = document.getElementById('add-link-btn');
const tagFilterDiv = document.getElementById('tag-filter');

// Event Listeners
homeBtn.addEventListener('click', () => showHomePage());
addLinkBtn.addEventListener('click', () => showAddLinkForm());

function showHomePage(tagFilter = '') {
    currentPage = 'home';
        
    fetch(`${API_URL}/links${tagFilter ? `?tag=${tagFilter}` : ''}`)
        .then(response => response.json())
        .then(links => {
            let html = '<h2>Todos los Enlaces</h2>';
            
            if (links.length === 0) {
                html += '<p>No se encontraron enlaces.</p>';
            } else {
                links.forEach(link => {
                    html += `
                        <div class="link-card">
                            <h3><a href="#" onclick="showLinkDetails(${link.id}); return false;">${link.title}</a></h3>
                            <p>${link.description || ''}</p>
                            <p><a href="${link.url}" target="_blank">${link.url}</a></p>
                            <div>
                                ${link.tags.map(tag => `<span class="tag">${tag.name}</span>`).join('')}
                            </div>
                        </div>
                    `;
                });
            }
            
            contentDiv.innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching links:', error);
            contentDiv.innerHTML = '<p>Error al cargar los enlaces. Inténtalo de nuevo.</p>';
        });
    
    loadTags();
}

function loadTags() {
    fetch(`${API_URL}/tags`)
        .then(response => response.json())
        .then(tags => {
            let html = '<p>Filtrar por etiqueta: ';
            html += '<select id="tag-select">';
            html += '<option value="">Todas las etiquetas</option>';
            
            tags.forEach(tag => {
                html += `<option value="${tag.name}">${tag.name}</option>`;
            });
            
            html += '</select></p>';
            
            tagFilterDiv.innerHTML = html;
            
            document.getElementById('tag-select').addEventListener('change', function() {
                showHomePage(this.value);
            });
        })
        .catch(error => {
            console.error('Error fetching tags:', error);
            tagFilterDiv.innerHTML = '';
        });
}

function showLinkDetails(id) {
    currentPage = 'detail';
    
    contentDiv.innerHTML = '<p>Cargando detalles del enlace...</p>';
    tagFilterDiv.innerHTML = '';
    
    fetch(`${API_URL}/links/${id}`)
        .then(response => response.json())
        .then(link => {
            let totalVotes = 0;
            if (link.votes && link.votes.length > 0) {
                totalVotes = link.votes.reduce((sum, vote) => sum + vote.value, 0);
            }
            
            let html = `
                <h2>${link.title}</h2>
                <p>${link.description || ''}</p>
                <p><a href="${link.url}" target="_blank">${link.url}</a></p>
                <div>
                    ${link.tags.map(tag => `<span class="tag">${tag.name}</span>`).join('')}
                </div>
                
                <div class="vote-section">
                    <h3>Votar por este enlace</h3>
                    <p>Votos actuales: <strong>${totalVotes}</strong></p>
                    <button onclick="addVote(${link.id})">Me gusta</button>
                </div>
                
                <div class="comments-section">
                    <h3>Comentarios</h3>
            `;
            
            if (link.comments && link.comments.length > 0) {
                link.comments.forEach(comment => {
                    html += `
                        <div class="comment">
                            <p>${comment.text}</p>
                            <small>Por: ${comment.userName}</small>
                        </div>
                    `;
                });
            } else {
                html += '<p>Aún no hay comentarios.</p>';
            }
            
            html += `
                    <h4>Añadir un Comentario</h4>
                    <form id="comment-form">
                        <div>
                            <label for="userName">Tu Nombre:</label>
                            <input type="text" id="userName" required>
                        </div>
                        <div>
                            <label for="commentText">Comentario:</label>
                            <textarea id="commentText" required></textarea>
                        </div>
                        <button type="submit">Enviar</button>
                    </form>
                </div>
            `;
            
            contentDiv.innerHTML = html;
            
            document.getElementById('comment-form').addEventListener('submit', function(e) {
                e.preventDefault();
                addComment(id);
            });
        })
        .catch(error => {
            console.error('Error fetching link details:', error);
            contentDiv.innerHTML = '<p>Error al cargar los detalles del enlace. Inténtalo de nuevo.</p>';
        });
}

function showAddLinkForm() {
    currentPage = 'add';
    
    let html = `
        <h2>Añadir Nuevo Enlace</h2>
        <form id="add-link-form">
            <div>
                <label for="title">Título:</label>
                <input type="text" id="title" required>
            </div>
            <div>
                <label for="url">URL:</label>
                <input type="url" id="url" required>
            </div>
            <div>
                <label for="description">Descripción:</label>
                <textarea id="description"></textarea>
            </div>
            <div>
                <label for="tags">Etiquetas (separadas por comas):</label>
                <input type="text" id="tags">
            </div>
            <button type="submit">Guardar</button>
        </form>
    `;
    
    contentDiv.innerHTML = html;
    tagFilterDiv.innerHTML = '';
    
    document.getElementById('add-link-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addLink();
    });
}

function addLink() {
    const title = document.getElementById('title').value;
    const url = document.getElementById('url').value;
    const description = document.getElementById('description').value;
    const tagsInput = document.getElementById('tags').value;
    
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    
    fetch(`${API_URL}/links`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title,
            url,
            description,
            tags
        })
    })
    .then(response => {
        if (response.ok) {
            alert('Enlace añadido correctamente');
            showHomePage();
        } else {
            alert('Error al añadir el enlace');
        }
    })
    .catch(error => {
        console.error('Error adding link:', error);
        alert('Error al añadir el enlace.');
    });
}

function addComment(linkId) {
    const userName = document.getElementById('userName').value;
    const text = document.getElementById('commentText').value;
    
    fetch(`${API_URL}/links/${linkId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userName,
            text
        })
    })
    .then(response => {
        if (response.ok) {
            alert('Comentario añadido correctamente!');
            showLinkDetails(linkId);
        } else {
            alert('Error al añadir el comentario.');
        }
    })
    .catch(error => {
        console.error('Error adding comment:', error);
        alert('Error al añadir el comentario.');
    });
}

function addVote(linkId) {
    fetch(`${API_URL}/links/${linkId}/votes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            value: 1
        })
    })
    .then(response => {
        if (response.ok) {
            alert('Voto registrado correctamente');
            if (currentPage === 'detail') {
                showLinkDetails(linkId);
            }
        } else {
            alert('Error al registrar el voto.');
        }
    })
    .catch(error => {
        console.error('Error registering vote:', error);
        alert('Error al registrar el voto.');
    });
}

showHomePage();