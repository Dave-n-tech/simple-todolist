const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["read book", "write essay"];
// const workItems = [];

//database connection
mongoose
  .connect("mongodb://0.0.0.0:27017/todolistDB")
  .then(() => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

const itemsSchema = new mongoose.Schema({
  name: String,
});

//Item model
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Write note",
});
const item2 = new Item({
  name: "edit note",
});
const item3 = new Item({
  name: "post note",
});

const defaultItems = [item1, item2, item3];

// list schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema)

// routes
app.get("/", async (req, res) => {
  let items;
  try {
    items = await Item.find();
    if (items.length === 0) {
      Item.insertMany(defaultItems)
        .then(() => {
          console.log("successfully inserted items");
        })
        .catch((err) => {
          console.log(err);
        });

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items }); //render list ejs file with variables similar to props
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/", async (req, res) => {
  let itemName = req.body.newItem;
  let listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    let foundList = await List.findOne({ name: listName })
    foundList.items.push(item)
    await foundList.save()
    res.redirect("/" + listName)
  }
});

app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if(listName === "Today"){
      await Item.deleteOne({ _id: checkedItemId });
      res.redirect("/")
    } else{
      let list = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
      res.redirect("/" + listName)
    }
  } catch (error) {
    console.log(error);
  }
});

// app.get("/work", (req, res) => {
//   res.render("list", { listTitle: "Work", newListItems: workItems });
// });

app.get("/:routeName", async (req, res) => {
  const customListName = lodash.capitalize(req.params.routeName)
  let item;

  try {
    item = await List.findOne({ name: customListName})
    if(!item){
      const list = new List({
        name: customListName,
        items: defaultItems
      })

      await list.save()

      res.redirect("/" + customListName)
    }else{
      res.render("list", { listTitle: item.name, newListItems: item.items })
    }
    
  } catch (error) {
    console.log(error)
  }

})

// app.post('/work', (req, res) => {
//     const item = req.body.newItem;
//     workItems.push(item)

//     res.redirect("/work")
// })

app.listen(3000, () => {
  console.log("server running on port 3000...");
});
