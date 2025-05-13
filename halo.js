
let userData = null;
let currentLyricIndex = -1;
let songDuration = 60;
let isPlaying = false;
let isFirstInteraction = true;

const profilePic = document.getElementById('profilePic');
const profileName = document.getElementById('profileName');
const profileBio = document.getElementById('profileBio');
const linksContainer = document.getElementById('linksContainer');
const currentYear = document.getElementById('currentYear');
const albumArt = document.getElementById('albumArt');
const songTitle = document.getElementById('songTitle');
const artist = document.getElementById('artist');
const lyrics = document.getElementById('lyrics');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const musicPlayer = document.getElementById('musicPlayer');
const musicToggle = document.getElementById('musicToggle');
const aiToggle = document.getElementById('aiToggle');
const progressBar = document.getElementById('progressBar');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');
const audioPlayer = document.getElementById('audioPlayer');
const themeToggle = document.getElementById('themeToggle');
const backButton = document.getElementById('backButton');
const body = document.body;

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        themeToggle.textContent = 'Mode Gelap';
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggle.textContent = 'Mode Terang';
    }
});

// Back button functionality
backButton.addEventListener('click', () => {
    window.location.href = 'skill.html';
});

// AI button functionality
aiToggle.addEventListener('click', () => {
    window.location.href = 'ai.html';
});

function getAverageColor(imageElement, callback) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!imageElement.complete || !imageElement.naturalWidth) {
        imageElement.onload = function() {
            extractColor();
        };
        return;
    }

    extractColor();

    function extractColor() {
        try {
            canvas.width = imageElement.naturalWidth || imageElement.width;
            canvas.height = imageElement.naturalHeight || imageElement.height;
            context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
            let r = 0, g = 0, b = 0;
            let pixelCount = 0;
            
            for (let i = 0; i < imageData.length; i += 4) {
                r += imageData[i];
                g += imageData[i + 1];
                b += imageData[i + 2];
                pixelCount++;
            }
            
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);
            
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const textColor = brightness > 128 ? '33, 33, 33' : '255, 255, 255';
            
            const bgColor = `rgba(${r}, ${g}, ${b}, 0.15)`;

            const hue1 = Math.floor(Math.random() * 360);
            const hue2 = (hue1 + 180) % 360;

            const primaryColor = `hsl(${hue1}, 70%, 50%)`;
            const secondaryColor = `hsl(${hue2}, 70%, 50%)`;

            callback(bgColor, `rgb(${textColor})`, textColor, primaryColor, secondaryColor);
        } catch (error) {
            console.error('Error extracting color:', error);
            // Fallback colors if there's an error
            callback('rgba(245, 245, 245, 0.15)', 'rgb(33, 33, 33)', '33, 33, 33', '#4a86e8', '#9c27b0');
        }
    }
}

function initializeFromJSON(data) {
    try {
        userData = data;

        // Set profile data
        profileName.textContent = data.profile?.name || "Your Name";
        profileBio.textContent = data.profile?.bio || "Your short biography or description goes here.";
        
        if (data.profile?.image) {
            profilePic.src = data.profile.image;
            
            profilePic.onload = function() {
                getAverageColor(profilePic, (bgColor, textColor, textColorRgb, primaryColor, secondaryColor) => {
                    document.documentElement.style.setProperty('--primary-color', primaryColor);
                    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
                });
            };
            
            profilePic.onerror = function() {
                console.error("Failed to load profile image");
                document.documentElement.style.setProperty('--primary-color', '#00FFFF');
                document.documentElement.style.setProperty('--secondary-color', '#FFFF00');
            };
        }

        // Set links
        linksContainer.innerHTML = '';
        
        if (data.links && Array.isArray(data.links)) {
            data.links.forEach((link, index) => {
                if (!link.url || !link.title) return;
                
                const linkElement = document.createElement('a');
                linkElement.href = link.url;
                linkElement.className = 'link-item animate-link';
                linkElement.style.animationDelay = `${0.1 * (index + 1)}s`;
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';
                
                const icon = document.createElement('i');
                icon.className = link.icon || 'fas fa-link';
                
                const text = document.createTextNode(link.title);
                
                linkElement.appendChild(icon);
                linkElement.appendChild(text);
                
                linksContainer.appendChild(linkElement);
            });
        }

        // Set music player data
        if (data.music) {
            songTitle.textContent = data.music.title || "Song Title";
            artist.textContent = data.music.artist || "Artist Name";
            
            if (data.music.albumArt) {
                albumArt.src = data.music.albumArt;
                albumArt.onerror = function() {
                    console.error("Failed to load album art");
                    albumArt.style.display = 'none';
                };
            }
            
            if (data.music.audioFile) {
                audioPlayer.src = data.music.audioFile;
                
                audioPlayer.addEventListener('loadedmetadata', function() {
                    songDuration = audioPlayer.duration;
                    totalTimeDisplay.textContent = formatTime(songDuration);
                });

                audioPlayer.addEventListener('timeupdate', function() {
                    currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
                    const percent = (audioPlayer.currentTime / songDuration) * 100;
                    progressBar.style.width = `${percent}%`;

                    updateLyricsDisplay(audioPlayer.currentTime);
                });

                audioPlayer.addEventListener('ended', function() {
                    audioPlayer.currentTime = 0;
                    if (isPlaying) {
                        audioPlayer.play();
                    } else {
                        isPlaying = false;
                        playPauseIcon.className = 'fas fa-play';
                    }
                });
            } else {
                songDuration = data.music.duration || 60;
                totalTimeDisplay.textContent = formatTime(songDuration);
            }
            
            // Handle lyrics display
            if (data.music.lyrics) {
                lyrics.textContent = data.music.lyrics;
            } else if (data.music.timeSync) {
                updateLyricsDisplay(0);
            } else {
                lyrics.textContent = "No lyrics available";
            }
        }

        currentYear.textContent = new Date().getFullYear();
    } catch (error) {
        console.error('Error initializing from JSON:', error);
    }
}

function updateLyricsDisplay(time) {
    if (!userData?.music?.timeSync) {
        return;
    }

    try {
        let lyricArray = userData.music.timeSync;
        
        // Handle different lyric formats
        if (Array.isArray(lyricArray) && lyricArray.length > 0) {
            // Check if it's a nested array (old format)
            if (Array.isArray(lyricArray[0])) {
                lyricArray = lyricArray[0];
            }
            
            // Find the current lyric
            let currentLyric = null;
            let newLyricIndex = -1;
            
            for (let i = 0; i < lyricArray.length; i++) {
                const lyricItem = lyricArray[i];
                if (typeof lyricItem === 'object' && lyricItem.time <= time) {
                    currentLyric = lyricItem;
                    newLyricIndex = i;
                } else {
                    break;
                }
            }

            if (currentLyric && newLyricIndex !== currentLyricIndex) {
                currentLyricIndex = newLyricIndex;
                
                lyrics.innerHTML = '';
                
                const lyricLine = document.createElement('div');
                lyricLine.className = 'lyrics-line active';
                lyricLine.textContent = currentLyric.text || "";
                
                lyrics.appendChild(lyricLine);
                
                lyricLine.classList.add('lyrics-fade-in');
                setTimeout(() => {
                    lyricLine.classList.remove('lyrics-fade-in');
                }, 500);
            }
        }
    } catch (error) {
        console.error('Error updating lyrics:', error);
        lyrics.textContent = "Error displaying lyrics";
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playPauseIcon.className = 'fas fa-pause';
        if (audioPlayer.src) {
            audioPlayer.play().catch(error => {
                console.error('Error playing audio:', error);
                isPlaying = false;
                playPauseIcon.className = 'fas fa-play';
            });
        }
    } else {
        playPauseIcon.className = 'fas fa-play';
        if (audioPlayer.src) {
            audioPlayer.pause();
        }
    }
}

musicToggle.addEventListener('click', () => {
    musicPlayer.classList.toggle('hidden');
});

playPauseBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    togglePlayPause();
});

document.querySelector('.progress-container').addEventListener('click', function(e) {
    if (audioPlayer.src) {
        const progressContainer = this;
        const rect = progressContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * songDuration;
    }
});

document.addEventListener('click', function playOnFirstInteraction() {
    if (isFirstInteraction) {
        isFirstInteraction = false;
        if (!isPlaying && audioPlayer.src) {
            togglePlayPause();
        }
        document.removeEventListener('click', playOnFirstInteraction);
    }
}, true);

document.addEventListener('DOMContentLoaded', function() {
    currentLyricIndex = -1; 
    
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Data loaded successfully:", data);
            initializeFromJSON(data);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            // Initialize with default values if data.json fails to load
            initializeFromJSON({
                profile: {
                    name: "Your Name",
                    bio: "Your short biography or description goes here.",
                    image: ""
                },
                links: [],
                music: {
                    title: "Song Title",
                    artist: "Artist Name",
                    albumArt: "",
                    audioFile: "",
                    duration: 60,
                    lyrics: "No lyrics available"
                }
            });
        });
});