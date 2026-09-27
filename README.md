# Weather / Body Flow V2

The `main` branch contains the verified STEP 1 particle space. Development of
STEP 2–6 is isolated on `feature/body-weather-flow` and keeps particle drawing
independent from camera, pose, hands, virtual medium, and weather services.

STEP 2–6 modules currently include the camera-safe Pose Landmarker adapter,
body-axis calibration, separate hand fields, virtual viscosity/vortex controls,
and Open-Meteo weather loading. MediaPipe is loaded lazily from the pinned
`@mediapipe/tasks-vision@0.10.22` CDN package so a failed camera or pose load
does not stop the particle loop.
