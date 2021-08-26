const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const server = jsonServer.create()
const router = jsonServer.router('./passengers.json')
const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))

server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789'

const expiresIn = '4h'

// Create a token from a payload 
function createToken(payload){
  return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

// Verify the token 
function verifyToken(token){
  return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

// Check if the user exists in passengers
function isAuthenticated({email, password}){
  return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
}

// Register New User
server.post('/auth/register', (req, res) => {
  console.log("register endpoint called; request body:");
  console.log(req.body);
  const {email, password} = req.body;

  if(isAuthenticated({email, password}) === true) {
    const status = 401;
    const message = 'Email and Password already exist';
    res.status(status).json({status, message});
    return
  }

fs.readFile("./users.json", (err, data) => {  
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({status, message})
      return
    };

    // Get current users data
    var data = JSON.parse(data.toString());

    // Get the id of last user
    var last_item_id = data.users[data.users.length-1].id;

    //Add new user
    data.users.push({id: last_item_id + 1, email: email, password: password}); //add some data
    var writeData = fs.writeFile("./users.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({status, message})
          return
        }
    });
});

// Create token for new user
  const access_token = createToken({email, password})
  console.log("Access Token:" + access_token);
  res.status(200).json({access_token})
})

// Login to one of the users from ./users.json
server.post('/auth/login', (req, res) => {
  console.log("login endpoint called; request body:");
  console.log(req.body);
  const {email, password} = req.body;
  if (isAuthenticated({email, password}) === false) {
    const status = 401
    const message = 'Incorrect email or password'
    res.status(status).json({status, message})
    return
  }
  const access_token = createToken({email, password})
  console.log("Access Token:" + access_token);
  res.status(200).json({access_token})
})

server.use(/^(?!\/auth).*$/,  (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Error in authorization format'
    res.status(status).json({status, message})
    return
  }
  try {
    let verifyTokenResult;
     verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

     if (verifyTokenResult instanceof Error) {
       const status = 401
       const message = 'Access token not provided'
       res.status(status).json({status, message})
       return
     }
     next()
  } catch (err) {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({status, message})
  }
})


//Get Passengers
server.get('/passengers',(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  //alert("Inside Get Passengers")
  if(1)
  {
    fs.readFile("./passengers.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
      var data = JSON.parse(data.toString());
      res.status(200).json(data.passengers)
    })
  }
  else{
    const status = 401
    const message = 'Invalid token or something went wrong'
    res.status(status).json({status, message})
    return
  }

})


//get passenger
server.get(`/passenger`,(req,res)=>{
   let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
   //alert("Inside Get Passengers")
   if(verifyTokenResult)
   {
     fs.readFile("./passengers.json", (err, data) => {  
       if (err) {
         const status = 401
         const message = err
         res.status(status).json({status, message})
         return
       };
       var data = JSON.parse(data.toString());
       let passenger=data.passengers.find(p=>p.id===req.body.id)
       console.log(passenger)
       if(passenger===undefined)
       {
        const status = 404
        const message = "passenger not found"
        res.status(status).json({status, message})
        return
       }
       res.status(200).json(passenger)
     })
   }
   else{
     const status = 401
     const message = 'Invalid token or something went wrong'
     res.status(status).json({status, message})
     return
   }
 
 })
 //update passenger
 server.put(`/updatePassenger`,(req,res)=>{
   let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
   //alert("Inside Get Passengers")
 
  if(verifyTokenResult)
   {
     fs.readFile("./passengers.json", (err, data) => {  
       if (err) {
         const status = 401
         const message = err
         res.status(status).json({status, message})
         return
       };
       var data = JSON.parse(data.toString());
       let oldPassengerData=data.passengers.findIndex(p=>p.id===req.body.id)
       console.log(oldPassengerData)
       if(oldPassengerData===-1)
       {
        const status = 404
        const message = "passenger not found"
        res.status(status).json({status, message})
        return
       }
      // let updatedPassengers=data.passengers.filter(p=>p.id!==req.body.id)
       //updatedPassengers.push(req.body);
      data.passengers.splice(oldPassengerData,1,req.body);
     // delete data.passengers[oldPassengerData]
     //  data.passengers.push(req.body);
      // console.log(data.passengers)
      // console.log(req.body)
       var writeData = fs.writeFile("./passengers.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({status, message})
          return
        }
    });
       res.status(200).json(data.passengers)
     })
   }
   else{
     const status = 401
     const message = 'Invalid token or something went wrong'
     res.status(status).json({status, message})
     return
   }
 
 })


 //Delete Passenger

 server.delete(`/deletePassenger`,(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

       if(verifyTokenResult)
       {
        fs.readFile("./passengers.json", (err, data) => {
          if(err)
          {
            const status = 401
         const message = err
         res.status(status).json({status, message})
         return
          };
          var data = JSON.parse(data.toString());
          
          let oldPassengerData=data.passengers.findIndex(p=>p.id===req.body.id)
          console.log(oldPassengerData)
          if(oldPassengerData===-1)
          {
           const status = 404
           const message = "passenger not found"
           res.status(status).json({status, message})
           return
          }
          data.passengers.splice(oldPassengerData,1)
         // delete data.passengers[oldPassengerData]

          var writeData = fs.writeFile("./passengers.json", JSON.stringify(data), (err, result) => {  // WRITE
            if (err) {
              const status = 401
              const message = err
              res.status(status).json({status, message})
              return
            }
            return;
          })
        })
       }
  
  else{
    const status = 403
              const message = "not a valid token"
              res.status(status).json({status, message})
              return
  }
  
  
 })


 //add passenger
 server.post(`/addPassenger`,(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  try{
       if(verifyTokenResult)
       {
        fs.readFile("./passengers.json", (err, data) => {
          if(err)
          {
            const status = 401
         const message = err
         res.status(status).json({status, message})
         return
          };
          var data = JSON.parse(data.toString());
          
        data.passengers.push(req.body)
          var writeData = fs.writeFile("./passengers.json", JSON.stringify(data), (err, result) => {  // WRITE
            if (err) {
              const status = 401
              const message = err
              res.status(status).json({status, message})
              return
            }
            else{
              res.status(200).json(req.body)
            }
          })
        })
       }
  }
  catch(error)
  {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({status, error})
  }
  
  
 })



 //get services
 
server.get('/services',(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  //alert("Inside Get Passengers")
  if(1)
  {
    fs.readFile("./services.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
      var data = JSON.parse(data.toString());
      res.status(200).json(data.services)
    })
  }
  else{
    const status = 401
    const message = 'Invalid token or something went wrong'
    res.status(status).json({status, message})
    return
  }

})

//get service


server.get(`/service`,(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  //alert("Inside Get Passengers")
  if(verifyTokenResult)
  {
    fs.readFile("./services.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
      var data = JSON.parse(data.toString());
      let service=data.services.find(p=>p.id===req.body.id)
      console.log(service)
      if(service===undefined)
      {
       const status = 404
       const message = "service not found"
       res.status(status).json({status, message})
       return
      }
      res.status(200).json(service)
    })
  }
  else{
    const status = 401
    const message = 'Invalid token or something went wrong'
    res.status(status).json({status, message})
    return
  }

})

//add service
server.post(`/addService`,(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  try{
       if(verifyTokenResult)
       {
        fs.readFile("./services.json", (err, data) => {
          if(err)
          {
            const status = 401
         const message = err
         res.status(status).json({status, message})
         return
          };
          var data = JSON.parse(data.toString());
          
        data.services.push(req.body)
          var writeData = fs.writeFile("./services.json", JSON.stringify(data), (err, result) => {  // WRITE
            if (err) {
              const status = 401
              const message = err
              res.status(status).json({status, message})
              return
            }
            else{
              res.status(200).json(req.body)
            }
          })
        })
       }
  }
  catch(error)
  {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({status, error})
  }
  
  
 })


//update service

server.put(`/updateService`,(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  //alert("Inside Get Passengers")

 if(verifyTokenResult)
  {
    fs.readFile("./services.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
      var data = JSON.parse(data.toString());
      let oldServiceData=data.services.findIndex(p=>p.id===req.body.id)
      console.log(oldServiceData)
      if(oldServiceData===-1)
      {
       const status = 404
       const message = "passenger not found"
       res.status(status).json({status, message})
       return
      }
     // let updatedPassengers=data.passengers.filter(p=>p.id!==req.body.id)
      //updatedPassengers.push(req.body);
     data.services.splice(oldServiceData,1,req.body);
    // delete data.passengers[oldPassengerData]
    //  data.passengers.push(req.body);
     // console.log(data.passengers)
     // console.log(req.body)
      var writeData = fs.writeFile("./services.json", JSON.stringify(data), (err, result) => {  // WRITE
       if (err) {
         const status = 401
         const message = err
         res.status(status).json({status, message})
         return
       }
   });
      res.status(200).json(data.services)
    })
  }
  else{
    const status = 401
    const message = 'Invalid token or something went wrong'
    res.status(status).json({status, message})
    return
  }

})


//delete service

server.delete(`/deleteService`,(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

       if(verifyTokenResult)
       {
        fs.readFile("./services.json", (err, data) => {
          if(err)
          {
            const status = 401
         const message = err
         res.status(status).json({status, message})
         return
          };
          var data = JSON.parse(data.toString());
          
          let serviceIndex=data.services.findIndex(p=>p.id===req.body.id)
          console.log(serviceIndex)
          if(serviceIndex===-1)
          {
           const status = 404
           const message = "passenger not found"
           res.status(status).json({status, message})
           return
          }
          data.services.splice(serviceIndex,1)
         // delete data.passengers[oldPassengerData]

          var writeData = fs.writeFile("./services.json", JSON.stringify(data), (err, result) => {  // WRITE
            if (err) {
              const status = 401
              const message = err
              res.status(status).json({status, message})
              return
            }
          
          })
        })
      
       }
  
  else{
              const status = 403
              const message = "not a valid token"
              res.status(status).json({status, message})
              return
  }
})



// Get meals
server.get('/meals',(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  //alert("Inside Get Passengers")
  if(1)
  {
    fs.readFile("./meals.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
      var data = JSON.parse(data.toString());
      res.status(200).json(data.meals)
    })
  }
  else{
    const status = 401
    const message = 'Invalid token or something went wrong'
    res.status(status).json({status, message})
    return
  }

})

//get meal
server.get('/meal',(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  //alert("Inside Get Passengers")
  if(verifyTokenResult)
  {
    fs.readFile("./meals.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
      var data = JSON.parse(data.toString());
      let meal=data.meals.find(p=>p.id===req.body.id)
      console.log(meal)
      if(meal===undefined)
      {
       const status = 404
       const message = "service not found"
       res.status(status).json({status, message})
       return
      }
      res.status(200).json(meal)
    })
  }
  else{
    const status = 401
    const message = 'Invalid token or something went wrong'
    res.status(status).json({status, message})
    return
  }

})

//add meal
server.post(`/addMeal`,(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  try{
       if(verifyTokenResult)
       {
        fs.readFile("./meals.json", (err, data) => {
          if(err)
          {
            const status = 401
         const message = err
         res.status(status).json({status, message})
         return
          };
          var data = JSON.parse(data.toString());
          
        data.meals.push(req.body)
          var writeData = fs.writeFile("./meals.json", JSON.stringify(data), (err, result) => {  // WRITE
            if (err) {
              const status = 401
              const message = err
              res.status(status).json({status, message})
              return
            }
            else{
              res.status(200).json(req.body)
            }
          })
        })
       }
  }
  catch(error)
  {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({status, error})
  }
  
  
 })



 //update meal

 server.put(`/updateMeal`,(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
  //alert("Inside Get Passengers")

 if(verifyTokenResult)
  {
    fs.readFile("./meals.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
      var data = JSON.parse(data.toString());
      let oldMealsIndex=data.meals.findIndex(p=>p.id===req.body.id)
      console.log(oldMealsIndex)
      if(oldMealsIndex===-1)
      {
       const status = 404
       const message = "passenger not found"
       res.status(status).json({status, message})
       return
      }
     // let updatedPassengers=data.passengers.filter(p=>p.id!==req.body.id)
      //updatedPassengers.push(req.body);
     data.meals.splice(oldMealsIndex,1,req.body);
    // delete data.passengers[oldPassengerData]
    //  data.passengers.push(req.body);
     // console.log(data.passengers)
     // console.log(req.body)
      var writeData = fs.writeFile("./meals.json", JSON.stringify(data), (err, result) => {  // WRITE
       if (err) {
         const status = 401
         const message = err
         res.status(status).json({status, message})
         return
       }
   });
      res.status(200).json(data.meals)
    })
  }
  else{
    const status = 401
    const message = 'Invalid token or something went wrong'
    res.status(status).json({status, message})
    return
  }

})

//delete meals
server.delete(`/deleteMeals`,(req,res)=>{
  let  verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

       if(verifyTokenResult)
       {
        fs.readFile("./meals.json", (err, data) => {
          if(err)
          {
            const status = 401
         const message = err
         res.status(status).json({status, message})
         return
          };
          var data = JSON.parse(data.toString());
          
          let meal=data.meals.findIndex(p=>p.id===req.body.id)
          console.log(meal)
          if(meal===-1)
          {
           const status = 404
           const message = "meal not found"
           res.status(status).json({status, message})
           return
          }
          data.meals.splice(meal,1)
         // delete data.passengers[oldPassengerData]

          var writeData = fs.writeFile("./meals.json", JSON.stringify(data), (err, result) => {  // WRITE
            if (err) {
              const status = 401
              const message = err
              res.status(status).json({status, message})
              return
            }
          
          })
        })
      
       }
  
  else{
              const status = 403
              const message = "not a valid token"
              res.status(status).json({status, message})
              return
  }
})





server.use(router)

server.listen(8000, () => {
  console.log('Run Auth API Server')
})


