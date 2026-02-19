const express = require('express');
const path = require('path');
const rackService = require('./services/rackService');
const rackItemService = require('./services/rackItemService');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use('/racks', require('./routes/racks'));
app.use('/rack-items', require('./routes/rackItems'));
app.use('/rack-items', require('./routes/disks'));
app.use('/ports', require('./routes/ports'));
app.use('/sockets', require('./routes/sockets'));


app.get('/', (req, res) => {
  const racks = rackService.getAll();

  const rackData = racks.map(rack => {
    const rackItems = rackItemService.getByRack(rack.id);

    const frontGrid = Array(rack.height_u).fill(null);
    const backGrid = Array(rack.height_u).fill(null);

    rackItems.forEach(item => {
      const targetGrid =
        item.orientation === 'front'
          ? frontGrid
          : backGrid;

      // mark first U
      targetGrid[item.position_u_start - 1] = {
        ...item,
        isStart: true
      };

      // mark filler U
      for (let i = 1; i < item.height_u; i++) {
        targetGrid[item.position_u_start - 1 + i] = {
          isFiller: true
        };
      }
    });

    const front = frontGrid.reverse();
    const back = backGrid.reverse();

    const uNumbers = Array.from(
      { length: rack.height_u },
      (_, i) => rack.height_u - i
    );

    return {
      ...rack,
      frontGrid: front,
      backGrid: back,
      uNumbers
    };
  });

  res.render('dashboard', { racks: rackData });
});



app.listen(3000, () => {
    console.log('Running on http://localhost:3000');
});
