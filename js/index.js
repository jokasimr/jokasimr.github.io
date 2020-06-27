import {initVideo, loadModels, createFaceMatcher} from './init.js';
import {DATASTORE, update_score} from './db.js';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const PEOPLE = [
  { name: 'johannes', url: '/persons/johannes.png' },
  { name: 'saranna', url: '/persons/saranna.jpg' },
  { name: 'ellen', url: '/persons/ellen.jpg' },
  { name: 'ellen', url: '/persons/ellen2.jpg' },
  { name: 'Carl Henrik', url: '/persons/carlhenrik.jpg' },
]

let GLOBAL_FACE_MATCHER;
DATASTORE.faces = new Set();

console.log(video, canvas);


function matchFace(fd) {
    const match = GLOBAL_FACE_MATCHER.findBestMatch(fd.descriptor);
    fd.match = match;
    console.log(match);
}


async function detectFaces() {
    const fullFaceDescriptions = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
    const resizedFaceDescriptions = faceapi.resizeResults(fullFaceDescriptions, canvas);
    console.log(resizedFaceDescriptions);
    return resizedFaceDescriptions;
}

function capitalize(name) {
        return `${name.slice(0, 1).toUpperCase()}${name.slice(1, name.length)}`;
}

function getScore(name) {
        const score = (DATASTORE.people && DATASTORE.people[name] && DATASTORE.people[name].score);
        return score ? Math.round(100 * score) / 100 : ''
}

function l2(a) {
        return Math.sqrt(a.reduce((s, v) => s + v**2, 0))
}

function sameBox(b1, b2) {
        return l2([b1.x - b2.x, b1.y - b2.y]) < Math.min(b1.width, b2.width) / 4;
}

function boxMatching(fds) {
    const faces = new Set();
    fds.forEach(fd => {
        let found = false;
        for (const f of DATASTORE.faces) {
            if (sameBox(f.detection.box, fd.detection.box)) {
                found = true;
                faces.add(f);
                DATASTORE.faces.delete(f);
            }
        }
        if (!found) {
                fd.animateName = true;
                matchFace(fd);
                if (fd.match.label !== 'unknown') faces.add(fd);
        }
    });
    DATASTORE.faces = faces;
}


function animateDrawText(txt, x, y) {
const ctx = context;
let dashLen = 220, dashOffset = dashLen, speed = 60, i = 0;

(function loop() {
  //ctx.clearRect(x, 0, 60, 150);
  ctx.setLineDash([dashLen - dashOffset, dashOffset - speed]); // create a long dash mask
  dashOffset -= speed;                                         // reduce dash length
  ctx.strokeText(txt[i], x, y);                               // stroke letter

  if (dashOffset > 0) requestAnimationFrame(loop);             // animate
  else {
    ctx.fillText(txt[i], x, y);                               // fill final letter
    dashOffset = dashLen;                                      // prep next char
    x += ctx.measureText(txt[i++]).width;
    if (i < txt.length) requestAnimationFrame(loop);
  }
})();
}


function drawFaces() {
    context.clearRect(0, 0, 480, 640);
    DATASTORE.faces.forEach(fd => {
        const box = fd.detection.box;
        const match = fd.match;
        const name = capitalize(match.label);
        const px = 35;
        context.font = `${px}px Georgia`;
        context.fillStyle = 'pink';
        //ctx.font = "50px Comic Sans MS, cursive, TSCu_Comic, sans-serif"; 
        context.lineWidth = 1.5; context.lineJoin = "round";
        context.strokeStyle = context.fillStyle = "pink";
        context.globalAlpha = 1;

        if (fd.animateName) {
            animateDrawText(name, box.topRight.x, box.topRight.y);
            animateDrawText(
                `    ${getScore(match.label)}`,
                box.topRight.x,
                box.topRight.y + px);
            fd.animateName = false;
        } else {
        //context.fillText(name, box.topRight.x - 2*px, box.topRight.y); 
            context.strokeText(name, box.topRight.x, box.topRight.y); 
            context.strokeText(`    ${getScore(match.label)}`, box.topRight.x, box.topRight.y+px); 
            context.fillText(name, box.topRight.x, box.topRight.y); 
            context.fillText(`    ${getScore(match.label)}`, box.topRight.x, box.topRight.y+px); 
 
        }
        //const drawBox = new faceapi.draw.DrawBox(box, { label: name });
        //drawBox.draw(canvas);
    });
}

loadModels()
  .then(() => console.log('models loaded'))
  .then(async () => GLOBAL_FACE_MATCHER = await createFaceMatcher(PEOPLE))
  .then(() => console.log('labels loaded'))
  .then(() => initVideo(video))
  .then(() => console.log('video started'))
  .then(() => setInterval(() => {
      console.log(DATASTORE);
      detectFaces()
        .then(fds => {
                boxMatching(fds);
                drawFaces();
        });
    },
    4000)
  )
  .catch(err => console.log(err))
