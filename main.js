const cookieName = "chocolate_chip";
const cookieValue = getCookie();
const exp = 1;
const noAuthPage = document.getElementById('no-auth');
const loginTgl = document.getElementById('login-tgl');
const logoutBtn = document.getElementById('logout-btn');
const registerTgl = document.getElementById('register-tgl');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const main = document.getElementById('main');
const taskList = document.querySelector('#task-list');
const loggedInAs = localStorage.getItem("user");
const addTask = document.querySelector('#add-task');

logoutBtn.addEventListener('click', () => {
   logout();
})

function logout() {
    if( getCookie() ) {
        document.cookie = `${cookieName}= ; expires = Thu, 01 Jan 1970 00:00:00 GMT`
    }
    displayPage(false);
    taskList.innerHTML = '';
    localStorage.removeItem('user');
}

loginTgl.addEventListener('click', () => {
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
})

registerTgl.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
})

loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(loginForm);
    const user = {
        "username": formData.get('username'),
        "password": formData.get('password'),
    };
    login(user);
})
    
registerForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(registerForm);
    const user = {
        "username": formData.get('username'),
        "firstname": formData.get('firstname'),
        "lastname": formData.get('lastname'),
        "newPassword": formData.get('password'),
    };
    register(user);
})

function setCookie(value) {
    const d = new Date();
    d.setTime(d.getTime() + (exp*24*60*60*1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cookieName + "=" + value + ";" + expires + ";path=/";
    console.log(document.cookie);
}

function getCookie() {
    let name = cookieName + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

function checkCookie() {
    let user = getCookie();
    if (user != "") {
        getTasks();
        displayPage(true);
    } else {
        displayPage(false);
    }
}

function displayPage(auth){
    if (!auth) {
        main.style.display = 'none';
        noAuthPage.style.display = 'block';
        loginForm.style.display = 'flex';
    } else {
        main.style.display = 'block';
        noAuthPage.style.display = 'none';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        document.getElementById('logged-in-user').innerText = `Logged in as: ${localStorage.getItem("user")}` ;
    } 
}

addTask.addEventListener('click', () => {
    const task = {
        "title": "New Task",
    }
    createTask(task); 
});

function register(user){
    reqToAPI("users", "", "POST", user).then(data => {setCookie(data.access_token); localStorage.setItem("user", data.username); getTasks(); displayPage(true); }); 
}
function login(user){
    reqToAPI("users/get-token", getCookie(), "POST", user).then(data => {setCookie(data.access_token); localStorage.setItem("user", data.username); getTasks(); displayPage(true); }); 
}
function getTasks(){
    reqToAPI("tasks", getCookie(), "GET").then(data => {data.forEach(renderTask);});
}
function createTask(task) {
    reqToAPI("tasks", getCookie(), "POST", task).then(data => {renderTask(data);});
}
function updateTask(task) {
    reqToAPI(`tasks/${task.id}`, getCookie(), "PUT", task);
}
function deleteTask(id) {
    reqToAPI(`tasks/${id}`, getCookie(), "DELETE");
}

async function reqToAPI(path, token, method, body) {
    let requestOptions = {
        method: method,
        headers: {Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json"}
    } 
    if (method != "GET" || method != "DELETE") {
        requestOptions.body = JSON.stringify(body);
    }
    try {
        if (method === "DELETE") {
            fetch(`http://demo2.z-bit.ee/${path}`, requestOptions);
        } else {
        const response = await fetch (`http://demo2.z-bit.ee/${path}`, requestOptions)
        const data = await response.json();
        return data;
        }
    } catch (err) {
        console.log(err)
    }
}

function renderTask(task) {
    const taskRow = createTaskRow(task);
    taskList.appendChild(taskRow);
}

function createTaskRow(task) {
    let taskRow = document.querySelector('[data-template="task-row"]').cloneNode(true);
    taskRow.removeAttribute('data-template');

    const title = taskRow.querySelector("[name='title']");
    title.value = task.title;

    title.addEventListener('keyup',  (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            task.title = title.value,
            updateTask(task);
        }
    });

    const checkbox = taskRow.querySelector("[name='completed']");
    checkbox.checked = task.marked_as_done;

    const deleteButton = taskRow.querySelector('.delete-task');
    deleteButton.addEventListener('click', () => {
        taskList.removeChild(taskRow);
        deleteTask(task.id);
    });

    hydrateAntCheckboxes(task, taskRow);

    return taskRow;
}

function createAntCheckbox() {
    const checkbox = document.querySelector('[data-template="ant-checkbox"]').cloneNode(true);
    checkbox.removeAttribute('data-template');
    hydrateAntCheckboxes(checkbox);
    return checkbox;
}

/**
 * See funktsioon aitab lisada eridisainiga checkboxile vajalikud event listenerid
 * @param {HTMLElement} element Checkboxi wrapper element või konteiner element mis sisaldab mitut checkboxi
 */
function hydrateAntCheckboxes(task, element) {
    const elements = element.querySelectorAll('.ant-checkbox-wrapper');
    for (let i = 0; i < elements.length; i++) {
        let wrapper = elements[i];

        // Kui element on juba töödeldud siis jäta vahele
        if (wrapper.__hydrated)
            continue;
        wrapper.__hydrated = true;


        const checkbox = wrapper.querySelector('.ant-checkbox');

        // Kontrollime kas checkbox peaks juba olema checked, see on ainult erikujundusega checkboxi jaoks
        const input = wrapper.querySelector('.ant-checkbox-input');

        if (input.checked) {
            checkbox.classList.add('ant-checkbox-checked');
        }
        
        // Kui checkboxi või label'i peale vajutatakse siis muudetakse checkboxi olekut
        wrapper.addEventListener('click', () => {
  
            checkbox.classList.toggle('ant-checkbox-checked');
            task.marked_as_done = input.checked;
            updateTask(task);
        });
    }
}
