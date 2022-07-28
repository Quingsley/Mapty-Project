'use strict';

// workout class

class Workout {

    date = new Date();
    id = Date.now() + ''.slice(-10);
    constructor(coords,distance,duration) {
        this.coords = coords; // [lat,lng]
        this.distance = distance; // km
        this.duration = duration; //mins
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords,distance,duration,cadence) {
        super(coords,distance,duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        //mins/m
        this.pace = this.cadence / this.duration;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';
     constructor(coords,distance,duration,elavationGain) {
        super(coords,distance,duration);
        this.elavationGain = elavationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}


//////////////////////////////////////////
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');



// APPLICATION ARCHITECTURE
class App {
    #mapZoomLevel = 13;
    #map;
    #mapEvent;
    #workout = [];
    constructor(){

        // get postion of user
        this._getPosition();
        
        // retrieve data from local storage
        this._getLocalStorage();
        // event handlers
        form.addEventListener('submit',this._newWorkout.bind(this));
        // toggle the select form input
        inputType.addEventListener('change',this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
     }
    _getPosition(){
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
             alert('Cannot get your location');
            })
        }
    }
    _loadMap(postion) {
         const {latitude} = postion.coords;
            const {longitude} = postion.coords;
        //console.log(`https://www.google.com/maps/@-${latitude},${longitude},12z`);

            const coords = [latitude, longitude];
            this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
             // handling clicks on map
        
            this.#map.on('click',this._showForm.bind(this));

            this.#workout.forEach(work => {
            this._renderWorkoutMarker(work);
        })
    }
        
    _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
     }
    _hideForm() {
        // empty fields
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid',1000);
    }
    _toggleElevationField(){
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e){
        e.preventDefault();

        const isValid = (...inputs) => inputs.every(num => Number.isFinite(num));
        const isPostive = (...inputs) => inputs.every(num => num > 0 );
        // get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat,lng} = this.#mapEvent.latlng;
        let workout;

        // check if data is valid
        if(type === 'running') {
            const cadence = +inputCadence.value;
            if(!isValid(distance,duration,cadence) ||
            !isPostive(distance,duration,cadence)) 
            return alert('inputs must be positive numbers');

            workout = new Running([lat,lng],distance,duration,cadence);
        }

         if(type === 'cycling') {
            const elevation = +inputElevation.value;
            if(!isValid(distance,duration,elevation) ||
            !isPostive(distance,duration)) 
            return alert('inputs must be positive numbers');
             workout = new Cycling([lat,lng],distance,duration,elevation);
        }

        // add neworkout to workout array
        this.#workout.push(workout);
       // console.log(workout);

        // render workoutMarker
        this._renderWorkoutMarker(workout);
        //render workout
        this._renderWorkout(workout);

      // clear input fields and hide the from
        this._hideForm();

       // storing data on local storage 
        this._setLocalStorage();
    }
     // display marker
     _renderWorkoutMarker(workout) {
             L.marker(workout.coords)
                .addTo(this.#map)
                .bindPopup(
                    L.popup({
                        maxWidth: 250,
                        minWidth: 100,
                        autoClose: false,
                        closeOnClick: false,
                        className: `${workout.type}-popup`,
                    })
        
                ).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' } ${workout.description}`)
                .openPopup();
        }
    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;

        if(workout.type === 'running') {
            html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.distance.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
        }

        if(workout.type === 'cycling') {
            html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elavationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
        }

        form.insertAdjacentHTML('afterend', html);

    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        //console.log(workoutEl);
        if(!workoutEl) return;

        const workout = this.#workout.find(work => work.id === workoutEl.dataset.id);
        
        this.#map.setView(workout.coords,this.#mapZoomLevel,{
            animate: true,
            pan: {
                duration: 1,
            }
        })
        
    }

    _setLocalStorage() {
        localStorage.setItem('workouts',JSON.stringify(this.#workout));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if(!data) return;
        this.#workout = data;
        this.#workout.forEach(work => {
            this._renderWorkout(work);
        })

    }

    _resetLocalStorage() {
        localStorage.removeItem('workouts');
        location.reload();
    }
    
}

const app = new App();

           
