import { app } from "./app";

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error("Unable to start server:", error);
    }
})();
