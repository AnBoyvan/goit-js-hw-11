import './css/styles.css';
import { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import { refs } from './js/refs';
import { getItemTemplate } from './js/itemTemplate';
import { fetchImage } from './js/PixabayAPI';

let pageNumber = 1;
let itemsPerPage = 40;
let query = '';

const options = {
  rootMargin: '200px',
  threshold: 1.0,
};

const observer = new IntersectionObserver(onGallerySkroll, options);

new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

async function onFormSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const searchQuery = form.elements.searchQuery.value.trim();
  if (searchQuery === '') return;
  if (searchQuery !== query) {
    refs.gallery.innerHTML = '';
    query = searchQuery;
    pageNumber = 1;
    e.target.reset();
  }

  await fetchImage(query, pageNumber, itemsPerPage)
    .then(data => {
      if (data.hits.length === 0) {
        Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
      } else {
        Notify.success(`Hooray! We found ${data.totalHits} images.`);
        getItemTemplate(data.hits);
        const markup = getItemTemplate(data.hits);
        refs.gallery.innerHTML = markup;
        lightbox.refresh();
        smoothScroll();
        observer.observe(refs.sentinel);
      }
    })
    .catch(error => error.message);
}

async function onGallerySkroll(entries) {
  entries.forEach(async entry => {
    if (entry.isIntersecting && query !== '') {
      pageNumber += 1;
      await fetchImage(query, pageNumber, itemsPerPage)
        .then(data => {
          const totalPage = data.totalHits / itemsPerPage;
          if (pageNumber >= totalPage) {
            Notify.info(
              "We're sorry, but you've reached the end of search results."
            );
            observer.unobserve(refs.sentinel);
            pageNumber = 1;
            return;
          }

          getItemTemplate(data.hits);
          const markup = getItemTemplate(data.hits);
          refs.gallery.insertAdjacentHTML('beforeend', markup);
          lightbox.refresh();
          smoothScroll();
        })
        .catch(error => error.message);
      await lightbox.refresh();
    }
  });
}

const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

async function smoothScroll() {
  const { height: cardHeight } =
    refs.gallery.firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

refs.searchForm.addEventListener('submit', onFormSubmit);
