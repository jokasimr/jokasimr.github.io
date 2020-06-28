export function initVideo(video) {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
          "video": {
                  facingMode: 'environment',
          },
      })
        .then(function(stream) {
          //video.src = window.URL.createObjectURL(stream);
          video.srcObject = stream;
          video.play();
        });
  }
}

const MODEL_URL = '/models'
export async function loadModels() {
    await faceapi.loadTinyFaceDetectorModel(MODEL_URL)
    await faceapi.loadSsdMobilenetv1Model(MODEL_URL)
    await faceapi.loadFaceLandmarkModel(MODEL_URL)
    await faceapi.loadFaceRecognitionModel(MODEL_URL)
}

export async function createFaceMatcher(people) {
    const labeledFaceDescriptors = await Promise.all(
        people.map(async label => {
            const img = await faceapi.fetchImage(label.url);
            const fullFaceDescription = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
    
            if (!fullFaceDescription) {
                throw new Error(`no faces detected for ${label.name}`)
            }
    
           const faceDescriptors = [fullFaceDescription.descriptor];
           return new faceapi.LabeledFaceDescriptors(label.name, faceDescriptors);
        })
    );
    const maxDescriptorDistance = 0.6
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance)
    return faceMatcher;
}
