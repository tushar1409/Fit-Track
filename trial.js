'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent, workout;
let workouts = [];

class App {
  constructor() {}

  _getPosition() {
    /*USING GEOLOCATION API TO GET CURRENT LOCATION OF USER

    IT HAS 2 FUNCTIONS.FIRST FOR ACTUALLY HANDLING THE TASK ON SUCCESSFUL ACQUISITON OF POSITION.SECOND IS TO DISPLAY THE ERROR MESSAGE IN CASE LOCATION IS NOT FOUND*/
    navigator.geolocation.getCurrentPosition(this._loadMap, function () {
      alert("Couldn't find your location.");
    });
  }

  _loadMap(position) {
    console.log(position);
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    //CODE USED FROM LEAFLET LIBRARY TO DISPLAY MAP AND ALSO A MARKER ON THE MAP
    map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    //A SORT OF AN EVENT LISTENER THAT WE ARE MANUALLY CREATING USING LEAFLET LIBRARY TO GET THE LOCATION OF CLICK ON THE MAP.
    map.on('click', function (mapEv) {
      mapEvent = mapEv;
      //RENDERING WORKOUT INPUT FORM ON CLICK
      form.classList.remove('hidden');
      inputDistance.focus(); //TO BRING CURSOR ON THIS FIELD DIRECTLY IN THE FORM
    });
  }

  _toggleElevationField() {
    //CHANGING CADENCE TO ELEVATION GAIN WHENEVER RUNNING IS CHANGED TO CYCLING
    inputType.addEventListener('change', function () {
      inputElevation
        .closest('.form__row')
        .classList.toggle('form__row--hidden');
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    });
  }

  _newWorkout() {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      //GET DATA FROM FORM
      const type = inputType.value;
      const distance = Number(inputDistance.value);
      const duration = Number(inputDuration.value);
      let lat1 = mapEvent.latlng.lat;
      let lng1 = mapEvent.latlng.lng;

      //IF RUNNING,CREATE RUNNING OBJECT
      if (type === 'running') {
        const cadence = Number(inputCadence.value);
        //CHECK IF DATA IS VALID
        if (
          !Number.isFinite(distance) ||
          !Number.isFinite(duration) ||
          !Number.isFinite(cadence)
        ) {
          return alert('Input has to be a positive integer!');
        }
        if (distance < 0 || duration < 0 || cadence < 0) {
          return alert('Input has to be a positive integer!');
        }
        workout = new Running([lat1, lng1], distance, duration, cadence);
      }

      //IF CYCLING,CREATE CYCLING OBJECT
      if (type === 'cycling') {
        const elevation = Number(inputElevation.value);
        //CHECK IF DATA IS VALID
        if (
          !Number.isFinite(distance) ||
          !Number.isFinite(duration) ||
          !Number.isFinite(elevation)
        ) {
          return alert('Input has to be a positive integer!');
        }
        if (distance < 0 || duration < 0) {
          return alert('Input has to be a positive integer!');
        }
        workout = new Cycling([lat1, lng1], distance, duration, elevation);
      }

      //ADD NEW OBJECT TO WORKOUT ARRAY
      workouts.push(workout);
      console.log(workout);

      //RENDER WORKOUT ON MAP AS MARKER

      //MARKER CREATION CODE TAKEN FROM LEAFLET LIBRARY & MODIFIED ACCORDING TO OUR NEEDS WITH THE HELP AND REFERNCE OF LEAFLET DOCUMENTATION
      console.log(mapEvent);
      let lat = mapEvent.latlng.lat;
      let lng = mapEvent.latlng.lng;
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(
          L.popup({
            maxwidth: 250,
            minwidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${type}-popup`,
          })
        )
        .setPopupContent('Workout')
        .openPopup();

      //RENDER WORKOUT ON LIST
      this.renderWorkout(workout);

      //CLEARING INPUT FIELDS
      inputDistance.value = inputDuration.value = inputCadence.value = '';
    });
  }
}

//CREATING OBJECTS FOR app CLASS
const app = new App();
app._getPosition();
app._newWorkout();
app._toggleElevationField();

//PARENT CLASS FOR WORKOUT TYPES:CYCLING AND RUNNING.HAS COMMON PROPS. OF BOTH WORKOUTS
class Workout {
  date = new Date();
  id = Date.now() + ''.slice(-10); //LAST 10 CHARACTERS OF NEW DATE WHICH IS CONVERTED INTO IS STRING IS USED AS UNIQUE ID FOR EACH WORKOUT
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

//CHILD CLASSES OF WORKOUT PARENT CLASS
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); //INHERITING PARENT CLASS VARIABLES
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration); //INHERITING PARENT CLASS VARIABLES
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

function renderWorkout(workout) {
  let html = `
  <li class="workout workout--${workout.type}" data-id="${workout.id}">
  <h2 class="workout__title">${workout.description}</h2>
  <div class="workout__details">
    <span class="workout__icon">${
      workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
    }</span>
    <span class="workout__value">${workout.distance}</span>
    <span class="workout__unit">km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⏱</span>
    <span class="workout__value">${workout.duration}</span>
    <span class="workout__unit">min</span>
  </div>`;
  if (workout.type === 'runnning')
    html += ` 
  <div class="workout__details">
  <span class="workout__icon">⚡️</span>
  <span class="workout__value">${workout.pace.toFixed(1)}</span>
  <span class="workout__unit">min/km</span>
</div>
<div class="workout__details">
  <span class="workout__icon">🦶🏼</span>
  <span class="workout__value">178</span>
  <span class="workout__unit">spm</span>
</div>
</li>`;

  if (workout.type === 'cycling')
    html += `<div class="workout__details">
<span class="workout__icon">⚡️</span>
<span class="workout__value">${workout.speed.toFixed(1)}</span>
<span class="workout__unit">km/h</span>
</div>
<div class="workout__details">
<span class="workout__icon">⛰</span>
<span class="workout__value">${workout.elevationGain}</span>
<span class="workout__unit">m</span>
</div>
</li>
`;
  form.insertAdjacentHTML('afterend', html);
}

function _setDescription() {
  // prettier-ignore
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  this.description = `${this.type[0].toUpperCase()}${this.type.slice(
    1
  )} on ${this.date.getMonth()} ${this.date.getDate()}`;
}
