const apiKey = 'dce0230841ba4dd7b5723747240711'; // Weather API Key

// State for temperature unit (Celsius by default)
let isCelsius = true;

document.getElementById('searchButton').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value.trim();
    if (city) {
        fetchWeather(city);
    } else {
        alert('Please enter a city name.');
    }
});

function fetchWeather(city) {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('d-none');

    fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=5&aqi=no`)
        .then(response => {
            if (loader) loader.classList.add('d-none');
            if (!response.ok) throw new Error('City not found');
            return response.json();
        })
        .then(data => {
            const isDay = data.current.is_day === 1;
            displayWeather(data);
            displayForecast(data.forecast.forecastday); // Display the 5-day forecast
            updateBackground(data.current.condition.text, isDay);
        })
        .catch(error => {
            if (loader) loader.classList.add('d-none');
            alert(error.message);
        });
}

function displayWeather(data) {
    const weatherInfo = document.getElementById('weatherInfo');
    if (!weatherInfo) {
        console.error('Weather info element is missing.');
        return;
    }
    weatherInfo.classList.remove('d-none');

    document.getElementById('cityName').innerText = `${data.location.name}, ${data.location.country}`;
    document.getElementById('description').innerText = data.current.condition.text;
    document.getElementById('temperature').innerText = `${data.current.temp_c} °C`; // Default in Celsius
    document.getElementById('details').innerText = `Humidity: ${data.current.humidity}% | Wind Speed: ${data.current.wind_kph} km/h`;
    document.getElementById('dayNightIndicator').innerText = data.current.is_day === 1 ? 'Daytime' : 'Nighttime';

    // Fetch the time zone offset in hours
    const offset = parseFloat(data.location.utc_offset);
    updateLocalTime(offset); // Initialize live local time

    updateTemperatureUnit(data.current.temp_c, data.current.temp_f); // Update temperature unit toggle
}

function updateLocalTime(offset) {
    const localTimeElement = document.getElementById('localTime');
    if (!localTimeElement) return;

    // Initialize current time using the offset
    const nowUTC = new Date();
    const localTime = new Date(nowUTC.getTime() + offset * 3600000);

    // Update the time every second without recalculating from UTC
    setInterval(() => {
        localTime.setSeconds(localTime.getSeconds() + 1); // Increment local time by 1 second
        const hours = localTime.getHours();
        const minutes = localTime.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHour = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
        localTimeElement.innerText = `Local Time: ${formattedHour}:${minutes} ${ampm}`;
    }, 1000);
}

function displayForecast(forecastDays) {
    const forecastContainer = document.getElementById('forecastCards');
    if (!forecastContainer) {
        console.error('Forecast container element is missing.');
        return;
    }

    forecastContainer.innerHTML = ''; // Clear previous forecast

    forecastDays.forEach(day => {
        const forecastCard = document.createElement('div');
        forecastCard.classList.add('forecast-card');

        // Create the content for the card
        forecastCard.innerHTML = `
            <h4>${formatDate(day.date)}</h4>
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
            <p>${day.day.condition.text}</p>
            <p><strong>${isCelsius ? day.day.avgtemp_c + ' °C' : day.day.avgtemp_f + ' °F'}</strong></p>
            <p>Min: ${isCelsius ? day.day.mintemp_c + ' °C' : day.day.mintemp_f + ' °F'} | Max: ${isCelsius ? day.day.maxtemp_c + ' °C' : day.day.maxtemp_f + ' °F'}</p>
        `;

        forecastContainer.appendChild(forecastCard);
    });
}

function formatDate(date) {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(date).toLocaleDateString('en-US', options);
}

function updateBackground(condition, isDay) {
    const conditionLower = condition.toLowerCase();
    const videoSources = {
        sunny: isDay ? './videos/sunny_day.mp4' : './videos/sunny_night.mp4',
        clear: isDay ? './videos/sunny_day.mp4' : './videos/sunny_night.mp4',
        cloudy: isDay ? './videos/cloudy_day.mp4' : './videos/cloudy_night.mp4',
        rain: isDay ? './videos/rainy_day.mp4' : './videos/rainy_night.mp4',
        thunderstorm: isDay ? './videos/thunderstorm_day.mp4' : './videos/thunderstorm_night.mp4',
        snow: isDay ? './videos/snowy_day.mp4' : './videos/snowy_night.mp4',
        mist: './videos/mist.mp4',
        fog: './videos/fog.mp4',
        default: './videos/default.mp4',
    };

    const matchedCondition = Object.keys(videoSources).find(key => conditionLower.includes(key)) || 'default';
    const videoUrl = videoSources[matchedCondition];

    const videoBackground = document.getElementById('videoBackground');
    if (!videoBackground) {
        console.error('Video background element is missing.');
        return;
    }
    videoBackground.src = videoUrl;
    videoBackground.load();

    videoBackground.play().catch(error => {
        console.error('Video playback failed:', error);
        videoBackground.src = videoSources.default;
        videoBackground.load();
    });
}

// Toggle temperature unit
document.getElementById('toggleUnit').addEventListener('click', () => {
    isCelsius = !isCelsius; // Toggle the state
    const tempC = document.getElementById('temperature').dataset.tempC;
    const tempF = document.getElementById('temperature').dataset.tempF;
    updateTemperatureUnit(tempC, tempF);
});

function updateTemperatureUnit(tempC, tempF) {
    const temperatureElement = document.getElementById('temperature');
    if (!temperatureElement) return;

    temperatureElement.dataset.tempC = tempC; // Store temperature in data attributes
    temperatureElement.dataset.tempF = tempF;
    temperatureElement.innerText = isCelsius ? `${tempC} °C` : `${tempF} °F`;

    // Update forecast cards
    const forecastDays = document.querySelectorAll('.forecast-card');
    forecastDays.forEach(card => {
        const tempC = card.dataset.tempC;
        const tempF = card.dataset.tempF;
        card.querySelector('.temp').innerText = isCelsius ? `${tempC} °C` : `${tempF} °F`;
    });
}
