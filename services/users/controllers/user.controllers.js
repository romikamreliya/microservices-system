const usersModel = require("../model/users.model");
const {utils} = require("@app/shared");

class UserController {

  constructor() {
    this.upload = new utils.upload();
  }

  async Get(req, res) {
    try {

      const payload = {
        pagination: req.query?.pagination || false,
        page: req.query?.page || 1,
        limit: req.query?.limit || 10,
        search: req.query?.search || ""
      }

      const data = await usersModel.paginate({
        limit: Number(payload.limit),
        page: Number(payload.page),
        pagination: payload.pagination == "true" ? true : false,
        filters: {
          ...(payload?.search && {
            OR:[
              {name: payload.search ? { contains: payload.search } : undefined},
              {email: payload.search ? { contains: payload.search } : undefined}
            ]
          })
        },
        order: {
          "name": "desc"
        }
      });
      return utils.response.send({req, res, type:"SUCCESS", data});
    } catch (error) {
      console.log('error', error);
      
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async Create(req, res) {
    try {

      const payload = {
        name: req.body?.name || "",
        email: req.body?.email || ""
      }

      const validation = utils.ajv.ajvCheck({
        name: utils.ajv.prop("string", {minLength:3}),
        email: utils.ajv.prop("string", {minLength:3,format:"customEmail"})
      }, {
        required:["name","email"]
      });

      if (!validation(payload)) {
        return utils.response.send({req, res, type:"VALIDATION_ERROR", key: utils.ajv.errorMsg({error: validation.errors[0]})});
      }
      
      const result = await usersModel.insert(payload);

      return utils.response.send({req, res, type:"CREATED", data: result});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async Update(req, res) {
    try {

      const payload = {
        id: req.body?.id || "",
        ...(req.body?.name && {name: req.body.name}),
        ...(req.body?.email && {email: req.body.email})
      }

      const validation = utils.ajv.ajvCheck({
        id: utils.ajv.prop("string", {minLength:1}),
        name: utils.ajv.prop("string", {minLength:3}),
        email: utils.ajv.prop("string", {minLength:3,format:"customEmail"})
      }, {
        required:["id"]
      });

      if (!validation(payload)) {
        return utils.response.send({req, res, type:"VALIDATION_ERROR", key: utils.ajv.errorMsg({error: validation.errors[0]})});
      }

      const findData = await usersModel.findOne({id: Number(payload.id)});
      if (!findData?.id) {
        return utils.response.send({req, res, type:"NOT_FOUND"});
      }

      const result = await usersModel.update(Number(payload.id), {name: payload.name, email: payload.email});

      return utils.response.send({req, res, type:"UPDATED", data: result});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async Delete(req, res) {
    try {
      const payload = {
        id: req.body?.id,
      }

      const validation = utils.ajv.ajvCheck({
        id: utils.ajv.prop("string", {minLength:1})
      }, {
        required:["id"]
      });

      if (!validation(payload)) {
        return utils.response.send({req, res, type:"VALIDATION_ERROR", key: utils.ajv.errorMsg({error: validation.errors[0]})});
      }

      const findData = await usersModel.findOne({id: Number(payload.id)});
      if (!findData?.id) {
        return utils.response.send({req, res, type:"NOT_FOUND"});
      }

      await usersModel.delete({id: Number(payload.id)});

      return utils.response.send({req, res, type:"DELETE"});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async UploadImg(req, res) {
    try {

      // upload images
      await new Promise((resolve, reject) => {
        this.upload.getUploadMiddleware().single("reviewProfile")(req, res, (err) => {
          if (err) {
            return reject(new Error(err.message));
          }
          return resolve();
        });
      });

      return utils.response.send({req, res, type:"SUCCESS", data: req.file});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }
}
module.exports = new UserController();
