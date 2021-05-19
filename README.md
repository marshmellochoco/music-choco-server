# music-choco-server

Aim of this project is to create a audio streaming application that is similar to Spotify Web Player (but not a total clone of it). I created this project just to test out my React skills and to learn more about fullstack development also maintaining and managing a project.

## Getting Started
### Pre-requisite
- [NodeJS](https://nodejs.org/en/) (or npm)
- MongoDB (I'm using [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- My [music-choco](https://github.com/marshmellochoco/music-choco) or your own developed music player!

### Setting up development environment
```
git clone https://github.com/marshmellochoco/music-choco-server.git
cd music-choco-server && npm i
npm run start
```
*Make sure the port is open (Default: 4000)* 

You can find the list of API [here](api.md)

## npm packages used so far
- [express](https://www.npmjs.com/package/express)
- [cors](https://www.npmjs.com/package/cors)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [mongoose](https://www.npmjs.com/package/mongoose)
- [fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg)
- [get-mp3-duration](https://www.npmjs.com/package/get-mp3-duration)
- [dotenv](https://www.npmjs.com/package/dotenv)