module.exports.send = (req, res) => {
    res.status(200).json("enviado");
};

module.exports.sendMedia = (req, res) => {
    res.status(200).json(req.body);
};