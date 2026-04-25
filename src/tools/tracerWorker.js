import ImageTracer from 'imagetracerjs';

self.onmessage = function(e) {
    const { imageData, options } = e.data;
    try {
        const svgString = ImageTracer.imagedataToSVG(imageData, options);
        self.postMessage({ success: true, svgString });
    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};
