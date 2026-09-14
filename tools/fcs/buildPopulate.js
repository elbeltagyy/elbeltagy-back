function buildPopulate(populateStr) {
    if (!populateStr) return [];

    const fields = populateStr.split(' ');
    const populateMap = {}; //{model: [select]}

    // Group fields by model path
    fields.forEach(f => {// [model.select, ...]
        if (!f) return
        const [recPath, field] = f.split('.')
        const path = recPath?.includes('$') ? recPath.replace('$', '.') : recPath

        if (!populateMap[path]) populateMap[path] = [];
        if (field) populateMap[path].push(field);
    });

    // Convert to Mongoose populate format
    return Object.entries(populateMap).map(([path, fields]) => ({
        path,
        select: fields.length ? fields.join(' ') : undefined
    }));
}

module.exports = { buildPopulate }