console.log('IT’S ALIVE!');

// function $$(selector, context = document) {
//   return Array.from(context.querySelectorAll(selector));
// }
// navLinks = $$("nav a")

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
//   );

// if (currentLink) {
//     // or if (currentLink !== undefined)
//     currentLink.classList.add('current');
// }

// let pages = [
//   { url: '', title: 'Home' },
//   { url: 'projects/', title: 'Projects' },
//   { url: 'contact/', title: 'Contact' },
//   { url: 'resume/', title: 'Resume' }
// ];

// let nav = document.createElement('nav');
// document.body.prepend(nav);

// const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
//   ? "/"                  // Local server
//   : "/portfolio/";         // name of the GitHub repo 

// for (let p of pages) {
//   let url = p.url;
//   let title = p.title;

//   if (!url.startsWith('http')) {
//     url = BASE_PATH + url;
//   }

//   let a = document.createElement('a');
//   a.href = url;
//   a.textContent = title;

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' }
];

let nav = document.createElement('nav');
let ul = document.createElement('ul');
document.body.prepend(nav);
nav.appendChild(ul);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";        // Name of repo

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  let li = document.createElement('li');
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  let pat = location.pathname

  if (location.pathname.endsWith("index.html")){
    pat = location.pathname.replace("index.html", "")
  }
  if (a.host === location.host && a.pathname === pat) {
    a.classList.add('current');
  }

  let absolute = new URL(url, location.origin);

  a.href = absolute.href;
  a.textContent = title;

  if (absolute.host !== location.host) {
  a.target = "_blank";
  } 


  li.appendChild(a);
  ul.appendChild(li);
  
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Auto</option>
			<option value="light">Light</option>
			<option value="dark">Dark</option>
		</select>
	</label>`,
);

const select = document.querySelector('.color-scheme select');

select.addEventListener('input', function (event) {
  const selectedScheme = event.target.value;
  console.log('color scheme changed to', selectedScheme);

  // Apply it to the root element
  document.documentElement.style.setProperty('color-scheme', selectedScheme);

  // Optional: also apply a data-theme if you're using custom theming in CSS
  document.documentElement.setAttribute('data-theme', selectedScheme);
});

// 🔁 Load saved preference when the page loads
if ('colorScheme' in localStorage) {
  const savedScheme = localStorage.colorScheme;
  document.documentElement.style.setProperty('color-scheme', savedScheme);
  document.documentElement.setAttribute('data-theme', savedScheme); // optional, for styling
  select.value = savedScheme; // sync the dropdown with saved value
}

// 🎯 Save user preference and apply it when changed
select.addEventListener('input', function (event) {
  const selectedScheme = event.target.value;

  // Apply the selected theme
  document.documentElement.style.setProperty('color-scheme', selectedScheme);
  document.documentElement.setAttribute('data-theme', selectedScheme); // optional

  // Save it to localStorage
  localStorage.colorScheme = selectedScheme;

  console.log('color scheme changed to', selectedScheme);
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log(response);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("testing testing")
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel) {
  containerElement.innerHTML = '';
  for (const project of projects){
    const article = document.createElement('article');
    const heading = document.createElement(headingLevel);
    heading.textContent = project.title;
    
    const img = document.createElement('img');
    img.src = project.image;
    img.alt = project.title;

    const description = document.createElement('p');
    description.textContent = project.description;

    article.appendChild(heading);
    article.appendChild(img);
    article.appendChild(description);

  containerElement.appendChild(article);
  }
}

fetch('https://api.github.com/rate_limit')
  .then(response => response.json())
  .then(data => {
    console.log(data); // Logs the rate limit information
  })
  .catch(error => {
    console.error('Error fetching rate limit:', error);
  });


export async function fetchGitHubData(username) {
  console.log("making request to github")
  return fetchJSON(`https://api.github.com/users/${username}`);
 
}