import {
    FaceLandmarker,
    FilesetResolver,
    FaceLandmarkerResult,
    DrawingUtils,
} from "@mediapipe/tasks-vision";

class FaceLandmarkManager {
    private static instance: FaceLandmarkManager = new FaceLandmarkManager();
    private results!: FaceLandmarkerResult;
    faceLandmarker!: FaceLandmarker | null;
    smileExampleLandmarks!: FaceLandmarkerResult[] | null;
    // 从 src/smileExamples 中读读取每张图片，然后用于检测笑容
    smileExampleImages = [
        "smile-1.jpg",
        "smile-2.jpg",
        "smile-3.jpg",
        "smile-4.jpg",
        "smile-5.jpg",
        "smile-6.jpg",
        "smile-7.jpg",
        "smile-8.jpg",
    ];

    smileExampleImageSources = this.smileExampleImages.map(
        (imageName) => `src/smileExamples/${imageName}`
    );

    private constructor() {
        this.initializeModel();
    }

    static getInstance(): FaceLandmarkManager {
        return FaceLandmarkManager.instance;
    }

    initializeModel = async () => {
        this.faceLandmarker = null;
        this.smileExampleLandmarks = null;
        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        this.faceLandmarker = await FaceLandmarker.createFromOptions(
            filesetResolver,
            {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU",
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: "VIDEO",
                numFaces: 1,
            }
        );
    };

    getResults = () => {
        return this.results;
    };

    detectLandmarks = (videoElement: HTMLVideoElement, time: number) => {
        if (!this.faceLandmarker) return;

        const results = this.faceLandmarker.detectForVideo(videoElement, time);
        this.results = results;
        if (this.detectSmile(results)) {
            console.log("Smile detected");
        }
        return results;
    };

    detectSmile = (results: FaceLandmarkerResult) => {
        if (!results.faceLandmarks) return;

        const faceLandmarks = results.faceLandmarks[0];
        console.log("faceLandmarks: ", faceLandmarks);

        // 以 0、17、186、410 为关键点

        const { upperLip, lowerLip, leftMouth, rightMouth } = {
            upperLip: faceLandmarks[0],
            lowerLip: faceLandmarks[17],
            leftMouth: faceLandmarks[186],
            rightMouth: faceLandmarks[410],
        };

        // 检测 leftMouth-lowerLip 和 rightMouth-lowerLip 两条线的夹角
        const angle_1 =
            (Math.atan2(lowerLip.y - leftMouth.y, lowerLip.x - leftMouth.x) *
                180) /
            Math.PI;
        const angle_2 =
            180 -
            (Math.atan2(lowerLip.y - rightMouth.y, lowerLip.x - rightMouth.x) *
                180) /
                Math.PI;

        console.log("angle_1: ", angle_1);
        console.log("angle_2: ", angle_2);

        if (angle_1 > 45 && angle_2 > 45) {
            return true;
        }

        return false;
    };

    drawLandmarks = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext("2d");
        if (!ctx || !this.results?.faceLandmarks) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const drawingUtils = new DrawingUtils(ctx);

        const lineWidth = 1.3;

        let lipcolor = "#E0E0E0";
        // 如果检测到笑容，就把嘴唇的颜色改为黄色
        if (this.detectSmile(this.results)) {
            lipcolor = "#FFCF2F";
        }


        for (const landmarks of this.results.faceLandmarks) {
 
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                { color: "#C0C0C070", lineWidth: lineWidth }
            );
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                { color: "#FF3030", lineWidth: lineWidth }
            );
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
                { color: "#FF3030", lineWidth: lineWidth }
            );
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                { color: "#30FF30", lineWidth: lineWidth }
            );
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
                { color: "#30FF30", lineWidth: lineWidth }
            );
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                { color: "#E0E0E0", lineWidth: lineWidth }
            );
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LIPS,
                { color: lipcolor, lineWidth: lineWidth }
            );
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
                { color: "#FF3030", lineWidth: lineWidth }
            );
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
                { color: "#30FF30", lineWidth: lineWidth }
            );
        }
    };
}

export default FaceLandmarkManager;
