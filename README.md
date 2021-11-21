# How to create apijx:


1. download admin folder from git

2. htacces: change the rout on 2 places and set localhost/.../admin (fill in the rout) (

3. If this is not your first time using apijx, delete admin/server/config/configDB.php and admin/server/config/configTables.

4. open in the browser link: localhost/.../admin (complete the path)

5. enter the name of the database and root admin user and pass in the respected fields (this is MANDATORY). Click on create.

6. If an error occurs, correct it, then return to step 3.

7. make at least 1 or 2 more users for the database you’re using (a regular - an average internet user, and an admin who is allowed to change the data) and import them in configDB.php.


## Open an admin panel
Open localhost/.../admin in the browser and you can login to admin panel.
You can login as superadmin, where you have options to change json files that represents your DataBase. 
You can login as admin with admin account. This is something that you want for the site administrator.

Regular users dont have access to admin panel. Regular users can get (post put or delete if you allow), only with the routes you defined in front-end.
Which brings you to the next section:


# Using routes on FRONT-END:


First include the js file in index.html: <script src = "admin/public/js/apijx/ajaxCall.js"></script>

Than you can call 2 functions:

ajaxCall
and
promiseAjaxCall


These are the functions called from the front-end. You can also look at function code, but the most important thing is that the function sorts the data for the call, and then it just calls the fetch and returns the data received.


ajaxCall has 4 arguments: ajaxCall (rout, method, data, callback)
Example:
    ajaxCall ('apijx/model/pictures/table', 'GET', {}, function(resp){
        console.log (resp);
    });


promiseAjaxCall returns a promise, it does not need a callback, so it is called via:
let response = await promiseAjaxCall (rout, method, data);
Example:
    let response = await promiseAjaxCall ('apijx/model/pictures/table', 'GET', {});
    if (response.OKERR) {
        console.log (response.lines);
    }

## Path
Path in the example: 'apijx/model/pictures/table' has 4 items in the route.


call url always starts with apijx/ - that way, ajaxCall function will transform your call to admin folder.

The next is the model/ but only if the data is called for the table, however if the sql query is called, it can be sqlQuery or sqlParamQuery.

For now there will always be apijx/model/

After that comes the name of the table you need data from.
The example is the pictures/table (you can take any other table from the database).
And the last thing is whether you want the whole table (table/) or you only want one row of the table, and in that you‘d put :id.
So the whole table is obtained with: 'apijx/model/pictures/table'
And just one row with id 2 from the pictures: 'apijx/model/pictures /:2' table.


The method can be GET, POST, PUT or DELETE.
For POST, 4.arg is input, so path is: 'apijx/model/pictures/input
For PUT, 4.arg is :id, so path is: 'apijx/model/pictures/:2.
The row number 2 is changed
For DELETE, 4.arg is :id, so path: 'apijx/model/pictures/:2.
The row number 2 is deleted.


## Data
The data (in the example {}, empty object) is used to send additional data along with the request. When the GET method is used as a request, it can contain info about which rows you want, how many rows, which columns… If you do not send any additional info, you will get the results with default values.

The column names of a table are written as [table_name]_field_[field_name]

For example. pictures_field_name represents the column "name" from the "pictures" table.



Data options:

    let data = {
        orderBy: {pictures_field_sequence: 'ASC'}, // sorting field, if more are specified, it will be sorted by enumeration order

        linesPerRequest: 2, // number of rows to return, if omitted, returns max 50 rows. If 0 is entered, then returns all rows from the table.

        pageNumber: 2, // if max per page is 50 rows - 2 indicates it needs to return everything from 51-100 rows

        whereCols: [// for where in SQL.

            {colName: 'pictures_field_name', colVal: '%a%', oper: 'LIKE', logicOper: 'AND'},

            {colName: 'pictures_field_user_id', colVal: '3', oper: '=', logicOper: 'AND'},

            {colName: 'pictures_field_user_id', colVal: '5', oper: '=', logicOper: 'OR'}

        ], // this is for where in sql.  logicOper in the query goes BEFORE the condition. So in the example above:  user_id = 5 OR user_id = 3

        join: ["users"], // merge with a table

        whereCompGroup: ['2-3'] // if parentheses are used in whereCols.

        selCols: ['pictures_field_name', 'user_field_name']

    }

These are all possible variants, and if you use any of these options, then you use data as 3rd argument instead of empty object { }

Call example:
await ajaxCall ('apijx/model/pictures/table', 'GET', data, function (resp){ ... })
The above example shows how to get data from only one table.



## Join Tables
If you need two tables , you can call promiseAjaxCall twice (or one inside the another in ajaxCall) or use join.

    let data = {
        whereCols: [// for where in SQL.
            {colName: 'pictures_field_name', colVal: '% a%', oper: 'LIKE', logicOper: 'AND'},
            {colName: 'pictures_field_user_id', colVal: '3', oper: '=', logicOper: 'AND'}
        ],
        join: ["users"], // merge with a table
        selCols: ['pictures_field_name', 'user_field_name']
    }
    
For join, however, the condition for merging tables in the sql_fields.json file must be specified beforehand.

Example for using promiseAjaxCall twice: 

    let response1 = await promiseAjaxCall(..., {selCols:['table_field_id']}); //any rout with some ids
    let response2 = await promiseAjaxCall (path, 'GET', {
        whereCols: [{
            colName: 'pictures_field_user_id',
            colVal: '(' + response1.lines.map line =>line.id).join (",") + ')',
            opera: 'IN',
            logicOper: 'AND'
        }]
    })




# Response from backend


If await is not used, the callback function serves to process the results we got from the server (from the database). It must have one input argument, which is an object (called the response in the example) that contains all the data specified in the request.

The same goes for a call via await.

One example of response received data:

    response = {

        OKERR: true, // whether the request returned data. If there are no queues for results or an error has occurred on the server - this is false.

        total_lines: 3, (number of rows obtained as a result)

        linesPerRequest: 50, (how many max rows can be returned)

        pageNumber: 2, (page number, 0 if all data is returned)

        lines: [// rows from base. THE MOST IMPORTANT THING

            0: {id: "1", image: "pictures1.jpg", title: "", text: "", type: "main", order: "1"},

            1: {id: "2", image: "pictures2.jpg", title: "", text: "",…},

            2: {id: "3", image: "pictures3.jpg", title: "", text: "",…},

            length: 3

        ]

        orderBy: {pictures_field_id: "ASC"}, // the field by which it is all sorted

        searchBy: [], // fields from whereCols

        sql_query: "SELECT` pictures`.`id`, `pictures`.`picture`,` pictures`.`title`, `pictures`.`text`,` pictures`.`type`, `pictures`.`sequence `FROM` pictures` ORDER BY pictures.id ASC ", // which query has been executed. This serves only to correct bugs, and turns off in production mode

    }
