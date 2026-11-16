/* Transcribed from the visible Original menu.pdf pages, not the company proof.
   Prices and ingredients are retained. Obvious spelling/punctuation corrected.
   Ambiguous text stays visible with review notes. No company promotions imported. */
(function(root){
  let n=0;
  const dish=(name,price='',description='',variants=[],extras='',review='')=>({id:'dish-'+(++n),name,price,description,variants:variants.map(([label,price])=>({label,price})),extras,review,reviewed:false});
  const section=(id,name,page,notes,items,review='')=>({id,name,sourcePage:page,notes,items,review,reviewed:false,span:1,startPage:null,startColumn:null,photo:''});
  const sub=(name,description)=>dish(name,'13',description);
  const pizza=(name,small,large,description='',extras='')=>dish(name,'',description,[['Small',small],['Large',large]],extras);
  const lunch=(name,description,review='')=>dish(name,'',description,[],'',review);
  root.ITALIAN_GARDEN_SEED=[
    section('appetizers','Appetizers',2,'',[
      dish('Middle Eastern Combo','11','Hummus, dolmades, feta cheese, pita bread with homemade tzatziki.'),
      dish('Fried Trio','11','Fried calamari, fried mushrooms, and mozzarella sticks.'),
      dish('Musabaha Hummus','9','Homemade hummus where the chickpeas are left whole, not blended.'),
      dish('Baba Ghanouj','9','Fantastic, healthy blended roasted eggplant dip made in house.'),
      dish('Falafel','10','Six pieces of delicious homemade falafel on a bed of lettuce, pickle, tomato, and parsley with bread and a side of tahini sauce.'),
      dish('Spanakopita','10','Flaky phyllo dough with a comforting filling of spinach and feta cheese nestled in, baked to perfection.'),
      dish('Fried Kibbeh','10','Three pieces: mixture of potatoes, seasoned beef, onion, pomegranate, and nuts that is deep fried.'),
      dish('Grilled Kibbeh','10','Two pieces: homemade mixture of beef, onion, nuts, and pecans that is grilled.'),
      dish('Cheese Bread','7','Sub roll with garlic butter topped with mozzarella, baked and cut into ten pieces, served with a cup of marinara.'),
      dish('Cheese Fries','6','Fries topped with mozzarella cheese, baked.'),
      dish('Hummus','9','Homemade hummus served with bread.'),
      dish('Fried Calamari','9'),dish('Fried Shrimp','9'),dish('Mozzarella Sticks','7'),dish('Stuffed Jalapeño Peppers','9'),dish('Fried Mushrooms','7'),dish('Pita Bread','3'),dish('Garlic Bread','3')
    ]),
    section('pizza','Pizza',4,'',[
      pizza('Cheese','10','14'),pizza('Pepperoni','12','15'),
      pizza('Barbecue Chicken','13','19','BBQ sauce, chicken, onion, and mozzarella cheese with BBQ drizzled on top.'),
      pizza('Mediterranean','14','19','Gyro meat, feta cheese, tomato, olives, and mozzarella cheese.'),
      pizza('Meat Lovers','14','19','Hamburger, pepperoni, sausage, ham, and mozzarella cheese.'),
      pizza('Hawaiian','14','19','Pineapple, ham, and mozzarella cheese.'),
      pizza('House Special','14','19','Hamburger, pepperoni, mushroom, onions, green peppers, sausage, and mozzarella cheese.'),
      pizza('Chicken Alfredo','14','19','Alfredo sauce, chicken, mushrooms, onions, and mozzarella cheese.','Add broccoli $2.'),
      pizza('Vegetarian','13','16','Tomato, onions, green peppers, olives, mushroom, feta cheese, and mozzarella cheese.')
    ],'Original lists Small / Large but no diameters or slice counts. Do not import the company proof’s slice counts or pizza promotion.'),
    section('calzones','Calzones',4,'',[
      dish('Gyro Calzone','14','Gyro meat, feta cheese, olives, diced tomatoes, and mozzarella cheese.'),
      dish('Veggie Calzone','13','Sautéed onions, mushrooms, green peppers, tomatoes, feta cheese, olives, mozzarella cheese.'),
      dish('Chicken Calzone','14','Chicken, sautéed onions, mushrooms, green peppers, and mozzarella cheese.'),
      dish('Steak Calzone','14','Steak, sautéed onion, mushroom, green peppers, and mozzarella cheese.'),
      dish('Meat Lovers Calzone','14','Hamburger, pepperoni, ham, sausage, and mozzarella cheese.'),
      dish('Pepperoni Calzone','14','Pepperoni, sautéed onions, and mozzarella cheese.'),
      dish('Cheese Calzone','13','Ricotta cheese, feta cheese, and mozzarella cheese.')
    ]),
    section('sides','Sides',2,'',[
      dish('Steak Fries','4'),dish('Rice','4','Smoked rice or regular rice.'),dish('Greek Potatoes','5','Sliced potatoes sautéed on the grill top with added seasoning.'),
      dish('Sautéed Mixed Vegetables or Broccoli','5','Broccoli, cauliflower, and carrots sautéed on the grill top, or just broccoli.')
    ]),
    section('soup','Soup',2,'',[
      dish('Soup of the Day','','Ask your server for the soup of the day.',[['Cup','4'],['Bowl','7']])
    ]),
    section('coffee','Coffee Menu',2,'',[
      dish('Espresso','3'),dish('Lungo','3'),dish('Latte','5'),dish('Macchiato','4'),dish('Cappuccino','5'),dish('Americano','3'),dish('Latte Macchiato','5'),dish('Flat White','5')
    ]),
    section('salads','Salads',2,'Served with pita bread. Add meat or seafood $6: grilled chicken / grilled salmon / gyro meat / shrimp.\nChoice of dressings: House (Greek Italian), Ranch, Honey Mustard, Thousand Island, Balsamic, French, Blue Cheese.',[
      dish('Tossed Salad','9','Large bowl of romaine, lettuce, Kalamata olives, sliced black olives, cucumber, tomato, and pepperoncini.'),
      dish('House Special','12','Large bowl of romaine, lettuce, cucumber, tomato, Kalamata olives, sliced black olives, pepperoncini, ham, roast beef, turkey, and mozzarella cheese.'),
      dish('Greek Salad','12','Large bowl of romaine, lettuce, covered with feta cheese, cucumber, tomato, Kalamata olives, sliced black olives, and pepperoncini.'),
      dish('Antipasto','12','Large bowl of romaine, lettuce, cucumber, tomato, sliced black olives, Kalamata olives, pepperoncini, mozzarella cheese, ham, salami, and pepperoni.'),
      dish('Chicken Salad','12','Large bowl of romaine, lettuce, Kalamata olives, sliced black olives, cucumber, tomato, pepperoncini, feta cheese, and topped with your choice of grilled chicken or homemade chicken salad.'),
      dish('Salmon Salad','13','Large bowl of romaine, lettuce, Kalamata olives, sliced black olives, cucumber, tomato, and pepperoncini, topped with a beautiful piece of grilled salmon.'),
      dish('Tabbouleh','9','Large bowl of chopped lettuce, parsley, tomato, green onion salad topped with zesty, flavorful lemon oil dressing.'),
      dish('Fattoush','9','Large bowl of chopped lettuce, cucumber, tomato, fresh garlic, radish, green pepper topped with vibrant dressing.')
    ]),
    section('subs','Hot Oven 8-inch Subs',3,'$13 each, except where an extra charge is listed.',[
      sub('Philly Sub','Steak or chicken, sautéed onions, mushroom, green peppers, mayo, and provolone cheese on a sub roll toasted to perfection.'),
      dish('Zorba Sub','13','Chicken or beef with mayo, provolone cheese, sautéed mushrooms, green pepper and onion on a sub roll toasted and topped with lettuce, tomato, and homemade house dressing.',[],'Beef add $1.00.'),
      sub('Veal Parmigiana Sub','Breaded veal, marinara sauce, and topped with provolone cheese on a sub roll toasted to perfection.'),
      sub('Meatball Sub','Homemade meatballs covered in marinara sauce and topped with provolone cheese on a sub roll toasted to perfection.'),
      sub('Roast Beef Sub','Roast beef, mayo, and provolone cheese toasted on a sub roll and topped with lettuce, onion, tomato, and homemade house dressing.'),
      sub('Eggplant Parmigiana','Breaded eggplant, marinara sauce, and topped with provolone cheese on a sub roll toasted to perfection.'),
      sub('Italian Sub','Salami, pepperoni, ham, provolone cheese, and mayo on a sub roll toasted and topped with lettuce, tomato, onion, and homemade house dressing.'),
      sub('Super Sub','Roast beef, turkey, mayo, and provolone cheese on a sub roll toasted and topped with lettuce, tomato, onion, and homemade house dressing.'),
      sub('Chicken Parmigiana Sub','Breaded chicken, marinara sauce, and topped with provolone cheese on a sub roll toasted to perfection.'),
      sub('Turkey Sub','Turkey, mayo, and provolone cheese toasted on a sub roll and topped with lettuce, tomato, onion, and homemade house dressing.'),
      sub('Vegetarian Sub','Provolone cheese and mayo on a sub roll toasted and topped with lettuce, tomato, onion, green pepper, sliced mushroom, sliced olives, and homemade house dressing.')
    ]),
    section('sandwiches','Greek Pita & Steak Burgers',3,'',[
      dish('8 oz. Steak Burger','11','Burger, lettuce, tomato, onion, and mayo on a bun.'),
      dish('8 oz. Cheese Steak Burger','12','Burger, lettuce, tomato, onion, mayo, and provolone cheese on a bun.'),
      dish('8 oz. Special Steak Burger','13','Burger topped with sautéed onion, mushroom, green pepper, and provolone cheese.'),
      dish('Reuben Sandwich','12','Corned beef, provolone cheese, sauerkraut, and homemade Thousand Island dressing on rye bread, grilled.'),
      dish('Patty Melt','11','Burger topped with sautéed onions, provolone cheese, and mayo on rye bread, grilled to perfection.'),
      dish('Gyro Sandwich','12','Gyro meat, lettuce, tomato, onion, and homemade tzatziki sauce in a pita wrap.'),
      dish('Fish Sandwich','12','Fried fish fillet, lettuce, tomato, tartar sauce, and mayo on a bun.'),
      dish('Chicken Shawarma','12','Chicken with garlic sauce and Arabic pickles in a wrap.'),
      dish('Souvlaki Sandwich','12','Chicken with lettuce, tomato, onion, and homemade tzatziki sauce on a pita wrap.',[],'Beef add $1.00.'),
      dish('Falafel Sandwich','10','',[],'','The original prints question marks instead of a description. Owner must supply or approve leaving it blank.'),
      dish('Meat Shawarma','15','Lamb with tomato, onion, yoghurt, and tahini sauce in a wrap.')
    ]),
    section('greek','Greek Plates',4,'Plates served with side salad and feta cheese on top and pita bread.',[
      dish('Souvlaki Plate','','Marinated in spices, cooked to perfection with one side of your choice and a side of tzatziki sauce.',[['Chicken','16'],['Beef','17']]),
      dish('Homemade Moussaka','16','Layers of eggplant, potatoes, ground beef, topped with a béchamel sauce and baked to perfection.'),
      dish('Gyro Plate','15','Grecian delight of gyro meat cooked to perfection with one side of your choice and a side of tzatziki sauce.'),
      dish('Greek Combo Plate','20','Combination of gyro meat, chicken, and beef cooked to perfection with one side of your choice and a side of tzatziki sauce.'),
      dish('Athenian Plate','','Cooked to perfection on a bed of freshly homemade, with a balsamic glaze and one side of your choice.',[['Chicken','18'],['Beef','19'],['Shrimp','20']],'','Visible original description is incomplete and appears mixed with the Caprese description. Text retained without adding an ingredient; verify against the kitchen.'),
      dish('Caprese Beef Tenderloin','18','Cooked to perfection on a bed of fresh-cut mozzarella, tomatoes, and pesto sauce topped with delicious hummus.',[],'','Visible original places hummus under this dish and balsamic glaze under Athenian Plate. This may be a layout/content error. Confirm both descriptions; do not swap silently.'),
      dish('Zorba Plate','','With sautéed onions, mushrooms, green peppers combined with rice and a side of tzatziki sauce.',[['Chicken','18'],['Beef','19'],['Shrimp','20']]),
      dish('Zorba Combo Plate','20','Combination of chicken and beef with sautéed onions, mushrooms, green peppers combined with rice and a side of tzatziki sauce.')
    ]),
    section('italian','Italian',5,'Plates served with side salad and garlic bread. Add meatballs $3. Add mushrooms $2.',[
      dish('Spaghetti','14','Spaghetti pasta topped with your choice of meat sauce or marinara.'),
      dish('Baked Spaghetti','15','Spaghetti pasta topped with your choice of meat sauce or marinara and mozzarella cheese, baked.'),
      dish('Fettuccine Alfredo','','Fettuccine pasta combined with homemade Alfredo sauce.',[['Chicken','16'],['Shrimp','17']]),
      dish('Marsala','','In a savory Marsala wine sauce with mushroom and garlic over a bed of angel hair pasta.',[['Chicken','18'],['Shrimp','19']]),
      dish('Lasagna','15','Layer of pasta, ground beef, and ricotta cheese topped with meat sauce or marinara and mozzarella cheese, baked.'),
      dish('Ravioli','','Topped with meat sauce or marinara and mozzarella cheese, baked.',[['Cheese','14'],['Beef','15'],['Shrimp','16']]),
      dish('Stuffed Shells','15','Large shells stuffed with ricotta cheese topped with meat sauce or marinara and mozzarella cheese, baked.'),
      dish('Jordan Special','17','Chicken, sautéed onion, and ziti pasta mixed with homemade Alfredo.'),
      dish('Oven Baked Ziti','14','Ziti pasta, ricotta cheese, and your choice of meat sauce or marinara topped with mozzarella cheese, baked.'),
      dish('Manicotti','14','Long manicotti noodle filled with ricotta cheese topped with meat sauce or marinara and mozzarella cheese, baked.'),
      dish('Italian Garden Alfredo','17','Chicken, fettuccine pasta, sautéed onion, tomato, and spinach mixed with homemade Alfredo sauce.'),
      dish('Chicken Piccata','18','Lightly breaded chicken, capers, and mushroom over a bed of angel hair pasta topped with a savory lemon butter sauce.'),
      dish('Eggplant Parmigiana','16','Breaded eggplant topped with meat sauce or marinara and mozzarella cheese, baked. Served with a small side of spaghetti pasta with the same sauce as the eggplant.'),
      dish('Chicken Parmigiana','17','Breaded chicken and spaghetti pasta topped with meat sauce or marinara and mozzarella cheese, baked.'),
      dish('Veal Parmigiana','16','Breaded veal and spaghetti pasta topped with meat sauce or marinara and mozzarella cheese, baked.'),
      dish('Grilled Chicken with Beef Tenderloin','19','Chicken topped with beef and homemade dill sauce with one side of your choice.'),
      dish('Grilled Chicken with Shrimp','19','Chicken topped with shrimp and homemade dill sauce with one side of your choice.')
    ]),
    section('mediterranean','Mediterranean',5,'',[
      dish('Shawarma Plate','','Chicken with garlic sauce and Arabic pickles in a wrap served with Swiss salad and fries or rice and bread.',[['Chicken','17'],['Lamb','21']],'','Description says chicken, but original also lists a lamb variant. Original says “swiss salad”; confirm that wording.'),
      dish('Shawarma Over Rice','','Cooked to perfection over a delicious bed of homemade smoked rice and a side of garlic sauce and a special salad and bread.',[['Chicken','19'],['Lamb','23']]),
      dish('Kafta Kabob','19','2 hand-ground lamb and beef kabobs cooked on the grill with tomato and onion to mouth-watering perfection, and fries or rice and a special salad and bread.'),
      dish('Grilled Chicken Skewers','20','2 skewers of marinated chicken and red pepper and onion cooked on the grill to mouth-watering perfection, and fries or rice and a special salad and bread.'),
      dish('Tagine Casserole','20','Freshly made potatoes, beef, lamb, garlic, red pepper, and onion in a bowl topped with a special bread, baked to a beautiful bread bowl, served with rice and a special salad.'),
      dish('Cordon Bleu','19','Breast of turkey roasted and stuffed with cheese, mushroom, turkey bacon, and smoked turkey with a phenomenal homemade breading, fried to perfection, served with fries or rice and a special salad.')
    ]),
    section('seafood','Seafood',5,'Entrées served with one choice of side: rice / veggies / Greek potatoes / fries.',[
      dish('Seafood Sampler','20','Grilled salmon topped with shrimp and a creamy dill sauce with one side of your choice.'),
      dish('Mediterranean Baked Tilapia','17','Fresh tilapia baked with tomatoes, black olives, and parsley in a garlic butter sauce.'),
      dish('Grilled Salmon','18','6 oz. salmon cooked to perfection with one side of your choice.'),
      dish('Fresh Flounder','16','Fried or grilled to perfection with one side of your choice.'),
      dish('Shrimp Scampi','18','Shrimp cooked in garlic butter to perfection with fettuccine pasta or one side of your choice.')
    ]),
    section('desserts','Desserts',3,'',[
      dish('Cheesecake','5.50'),dish('Cannoli','5.50'),dish('Chocolate Cake','5.50'),dish('Limoncello','5.50'),dish('Baklava','5.50'),dish('Kunafa','7.00'),dish('Tiramisu','7.00')
    ],'Original groups the first five desserts at $5.50 and Kunafa / Tiramisu at $7.00. Confirm grouped pricing and whether “Limoncello” means cake.'),
    section('kids','Kids Menu',3,'$9 each. Includes water or iced tea only; all other drinks full price. Add to-go drinks $2.00.',[
      dish('Chicken Strips with Fries','9'),dish('Popcorn Shrimp with Fries','9'),dish('Pepperoni or Cheese Pizza','9'),dish('Chicken or Fettuccine Alfredo with Garlic Bread','9','',[],'','Original wording is “Chicken or fettuccine alfredo w/garlic bread.” Confirm the intended choices.'),
      dish('Lasagna with Meat Sauce or Marinara and Garlic Bread','9'),dish('Spaghetti with Meat Sauce or Marinara and Garlic Bread','9'),dish('Beef or Cheese Ravioli with Meat Sauce or Marinara and Garlic Bread','9')
    ],'No age limit is printed in the original. Confirm whether the to-go drink charge applies only here or throughout the menu.'),
    section('drinks','Drinks',3,'',[
      ...['Pepsi','Diet Pepsi','Starry','Dr. Pepper','Coke','Diet Coke','Mountain Dew','Sprite','Lemonade','Tea (Hot or Cold)','Apple Juice','Orange Juice'].map(name=>dish(name,'3')),
      dish('Bottled Water','2.00')
    ]),
    section('lunch-subs','Daily Lunch · Subs & Sandwiches',6,'From 11am through 3pm. $12.00 subs & sandwiches. Choose from fries or salad; iced tea or soda. Add to-go drinks $2.00.',[
      lunch('Philly Sub','Steak or chicken, sautéed onions, mushroom, green peppers, mayo, and provolone cheese on a sub roll toasted to perfection.'),
      lunch('Gyro Sandwich','Gyro meat, lettuce, tomato, onion, and homemade tzatziki sauce in a pita wrap.'),
      dish('Souvlaki Sandwich','','Chicken with lettuce, tomato, onion, and homemade tzatziki sauce on a pita wrap.',[],'Beef add $1.00.'),
      lunch('Chicken Parmigiana Sub','Breaded chicken, marinara sauce, and topped with provolone cheese on a sub roll toasted to perfection.'),
      lunch('Meatball Sub','Homemade meatballs covered in marinara sauce and topped with provolone cheese on a sub roll toasted to perfection.'),
      lunch('Fish Sandwich','Fried fish fillet, lettuce, tomato, tartar sauce, and mayo on a bun.'),
      lunch('Chicken Salad Sandwich','','Original has question marks instead of a description. Owner must supply or approve leaving it blank.'),
      lunch('Reuben Sandwich','Corned beef, provolone cheese, sauerkraut, and homemade Thousand Island dressing on rye bread, grilled.'),
      lunch('Veal Parmigiana Sub','Breaded veal, marinara sauce, and topped with provolone cheese on a sub roll toasted to perfection.'),
      dish('Zorba Sub','','Chicken with mayo, provolone cheese, sautéed mushrooms, green pepper and onion on a sub roll toasted and topped with lettuce, tomato, and homemade house dressing.',[],'Beef add $1.00.'),
      lunch('8 oz. Cheese Steak Burger','Burger, lettuce, tomato, onion, mayo, and provolone cheese on a bun.'),
      lunch('Vegetarian Sub','Provolone cheese and mayo on a sub roll toasted and topped with lettuce, tomato, onion, green pepper, sliced mushroom, sliced olives, and homemade house dressing.')
    ]),
    section('lunch-plates','Daily Lunch · Plates',6,'$14.00 plates. Includes side salad & bread. Add chicken $3.99.\nWe understand that you have a limited lunch break! Just call in your order; tell us what time you will be here, and we will have your table and food ready for you. Thank you for your patronage! Call-ins are very welcome! (864) 509-1702.',[
      lunch('Homemade Lasagna','Layer of pasta, ground beef, and ricotta cheese topped with meat sauce or marinara and mozzarella cheese, baked.'),
      lunch('Spaghetti','Spaghetti pasta topped with your choice of meat sauce or marinara.'),
      lunch('Fettuccine Alfredo','Fettuccine pasta combined with homemade Alfredo sauce.'),
      lunch('Ravioli','Topped with meat sauce or marinara and mozzarella cheese, baked.'),
      lunch('Manicotti','Long manicotti noodle filled with ricotta cheese topped with meat sauce or marinara and mozzarella cheese, baked.'),
      lunch('Stuffed Shells','Large shells stuffed with ricotta cheese topped with meat sauce or marinara and mozzarella cheese, baked.'),
      lunch('Chicken Salad','Steak or chicken, sautéed onions, mushroom, green peppers,','Original visibly repeats part of the Philly Sub description here. Incomplete source text retained; confirm the correct salad description.'),
      lunch('Gyro Salad','','Original has question marks instead of a description. Owner must supply or approve leaving it blank.')
    ])
  ];
})(typeof window!=='undefined'?window:globalThis);
