##Upstox Assignment##

###Installation###

Run the command ```npm install``` to install dependencies

Update the file "server/datasources.json". Set the host, port,database,user and password to appropriate values

Run the command ```node .``` to start the server. This will start the server at localhost:3000. Open localhost:3000/explorer to test the apis


###API documentation###

#### /customers/addCustomer ####
Type: POST
Request Body:
``` 
{
	"email": "user@example.com"
}
```
Response Body:
```
{
  "customer": {
    "customerId": "string",
    "email": "string",
    "referralId": "string",
    "payback": 0,
    "isAmbassador": false,
    "joiningDate": "2016-12-26",
    "lastUpdated": "2016-12-26"
  },
  "message": "string"
}
```
#### /customers/getCustomerById ####
Type: POST
Request Body: 
```
{
  "customerId": "string"
}
```
Response Body:
```
{
  "customerId": "string",
  "email": "string",
  "referralId": "string",
  "payback": 0,
  "isAmbassador": false,
  "joiningDate": "2016-12-26",
  "lastUpdated": "2016-12-26"
}
```
#### /customers/addReferral ####
Type: POST
Request Body: 
```
{
  "email": "string",
  "referralId": "string"
}
```
Response Body:
```
{
  "customer": {
    "customerId": "string",
    "email": "string",
    "referralId": "string",
    "payback": 0,
    "isAmbassador": false,
    "joiningDate": "2016-12-26",
    "lastUpdated": "2016-12-26"
  },
  "message": "string"
}
```


#### /customers/fetchAllChildren ####
Type: POST
Request Body: 
```
{
  "customerId": "string"
}
```
Response Body:
```
[
  {
    "customerId": "string",
    "email": "string",
    "referralId": "string",
    "payback": 0,
    "isAmbassador": false,
    "joiningDate": "2016-12-26",
    "lastUpdated": "2016-12-26"
  },
  ...
]
```

#### /customers/fetchAllCustomerWithReferralCount ####
Type: POST
Request Body: 
```
{
  "order": "string" //"asc" or "desc"
}
```
Response Body:
```
[
  {
    "customerId": "string",
    "email": "string",
    "referralId": "string",
    "payback": 0,
    "isAmbassador": false,
    "joiningDate": "2016-12-26",
    "lastUpdated": "2016-12-26",
    "referralCount": 0
  },
  ...
]
```

#### /customers/addAmbassador ####
Type: POST
Request Body: 
```
{
  "email": "string"
}
```
Response Body:
```
{
  "customer": {
    "customerId": "string",
    "email": "string",
    "referralId": "string",
    "payback": 0,
    "isAmbassador": true,
    "joiningDate": "2016-12-26",
    "lastUpdated": "2016-12-26"
  },
  "message": "string"
}
```

#### /customers/convertCustomerToAmbassador ####
Type: POST
Request Body: 
```
{
  "customerId": "string"
}
```
Response Body:
```
{
  "customer": {
    "customerId": "string",
    "email": "string",
    "referralId": "string",
    "payback": 0,
    "isAmbassador": true,
    "joiningDate": "2016-12-26",
    "lastUpdated": "2016-12-26"
  },
  "message": "string"
}
```

#### /customers/fetchAllAmbassadorChildren ####
Type: POST
Request Body: 
```
{
  "customerId": "string"
}
```
Response Body:
```
[
  {
    "customerId": "string",
    "email": "string",
    "referralId": "string",
    "payback": 0,
    "isAmbassador": false,
    "joiningDate": "2016-12-26",
    "lastUpdated": "2016-12-26"
  },
  ...
]
```

#### /customers/fetchAllAmbassadorChildrenAtNthLevel ####
Type: POST
Request Body: 
```
{
  "customerId": "string",
  "level": 0
}
```
Response Body:
```
[
  {
    "customerId": "string",
    "email": "string",
    "referralId": "string",
    "payback": 0,
    "isAmbassador": false,
    "joiningDate": "2016-12-26",
    "lastUpdated": "2016-12-26"
  },
  ...
]
```