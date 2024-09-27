app.use("/upload", upload.fields([{ name: "video" }, { name: "thumbnail" }]), async (req, res, next) => {
    console.log("start sending")
    try {
        const { files } = req
        console.log(files)
        let results = {}
        for (let file in files) {
            console.log(files[file][0].path)
            const result = await addToCloud(files[file][0].path, {
                folder: "admin",
                resource_type: "auto"
            })
            if (result) {
                const { original_filename, resource_type, secure_url, url, format, bytes } = result
                results[file] = { original_filename, resource_type, secure_url, url, format, size: bytes }
            }
        }

        console.log(results)
        res.json(results)
    } catch (error) {
        res.json(error)
        console.log(error)
    }
})
