import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://alligator.io/react/axios-react/
import axios from 'axios';

// https://underscorejs.org/
import _ from 'underscore';

// https://github.com/topojson/topojson
import * as topojson from 'topojson';

// https://www.npmjs.com/package/rc-slider
import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';
import './../styles/rc-slider-override.css';

// https://d3js.org/
import * as d3 from 'd3';

let interval, g, path;
// https://observablehq.com/@d3/u-s-map
const projection = d3.geoAlbersUsa().scale(1200).translate([487.5, 325]);

const languages = {
  'en': {
    confirmed:'confirmed',
    deaths:'deaths'
  },
  'sv':{
    confirmed:'bekräftade'
  }
}

const areaCenters = {"Alabama":{"Lat":32.7794, "Long":-86.8287},"Alaska":{"Lat":64.0685, "Long":-152.2782},"Arizona":{"Lat":34.2744, "Long":-111.6602},"Arkansas":{"Lat":34.8938, "Long":-92.4426},"California":{"Lat":37.1841, "Long":-119.4696},"Colorado":{"Lat":38.9972, "Long":-105.5478},"Connecticut":{"Lat":41.6219, "Long":-72.7273},"Delaware":{"Lat":38.9896, "Long":-75.505},"District of Columbia":{"Lat":38.9101, "Long":-77.0147},"Florida":{"Lat":28.6305, "Long":-82.4497},"Georgia":{"Lat":32.6415, "Long":-83.4426},"Hawaii":{"Lat":20.2927, "Long":-156.3737},"Idaho":{"Lat":44.3509, "Long":-114.613},"Illinois":{"Lat":40.0417, "Long":-89.1965},"Indiana":{"Lat":39.8942, "Long":-86.2816},"Iowa":{"Lat":42.0751, "Long":-93.496},"Kansas":{"Lat":38.4937, "Long":-98.3804},"Kentucky":{"Lat":37.5347, "Long":-85.3021},"Louisiana":{"Lat":31.0689, "Long":-91.9968},"Maine":{"Lat":45.3695, "Long":-69.2428},"Maryland":{"Lat":39.055, "Long":-76.7909},"Massachusetts":{"Lat":42.2596, "Long":-71.8083},"Michigan":{"Lat":44.3467, "Long":-85.4102},"Minnesota":{"Lat":46.2807, "Long":-94.3053},"Mississippi":{"Lat":32.7364, "Long":-89.6678},"Missouri":{"Lat":38.3566, "Long":-92.458},"Montana":{"Lat":47.0527, "Long":-109.6333},"Nebraska":{"Lat":41.5378, "Long":-99.7951},"Nevada":{"Lat":39.3289, "Long":-116.6312},"New Hampshire":{"Lat":43.6805, "Long":-71.5811},"New Jersey":{"Lat":40.1907, "Long":-74.6728},"New Mexico":{"Lat":34.4071, "Long":-106.1126},"New York":{"Lat":42.9538, "Long":-75.5268},"North Carolina":{"Lat":35.5557, "Long":-79.3877},"North Dakota":{"Lat":47.4501, "Long":-100.4659},"Ohio":{"Lat":40.2862, "Long":-82.7937},"Oklahoma":{"Lat":35.5889, "Long":-97.4943},"Oregon":{"Lat":43.9336, "Long":-120.5583},"Pennsylvania":{"Lat":40.8781, "Long":-77.7996},"Rhode Island":{"Lat":41.6762, "Long":-71.5562},"South Carolina":{"Lat":33.9169, "Long":-80.8964},"South Dakota":{"Lat":44.4443, "Long":-100.2263},"Tennessee":{"Lat":35.858, "Long":-86.3505},"Texas":{"Lat":31.4757, "Long":-99.3312},"Utah":{"Lat":39.3055, "Long":-111.6703},"Vermont":{"Lat":44.0687, "Long":-72.6658},"Virginia":{"Lat":37.5215, "Long":-78.8537},"Washington":{"Lat":47.3826, "Long":-120.4472},"West Virginia":{"Lat":38.6409, "Long":-80.6227},"Wisconsin":{"Lat":44.6243, "Long":-89.9941},"Wyoming":{"Lat":42.9957, "Long":-107.5512}};

function getHashValue(key) {
  let matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  return matches ? matches[1] : null;
}

const l = getHashValue('l') ? getHashValue('l') : 'en';
const type = getHashValue('type') ? getHashValue('type') : 'deaths';

const multiplier = (type === 'confirmed') ? 4 : 4; 

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data:{},
      dates:[],
      total_cases:0,
      total_deaths:0,
      year_month_idx:0
    }
  }
  componentDidMount() {
    // https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv
    axios.get('./data/data.json', {
    })
    .then((response) => {
      this.setState((state, props) => ({
        confirmed:response.data.confirmed,
        deaths:response.data.deaths,
        dates:_.keys(response.data[type]['Alabama']).filter((value, index, arr) => {
          return !(value === 'Province_State');
        })
      }), this.drawMap);
    })
    .catch(function (error) {
    })
    .then(function () {
    });
  }
  drawMap() {
    let width = 975;
    let height = 700;
    
    let svg = d3.select('.' + style.map_container).append('svg').attr('width', width).attr('height', height);
    path = d3.geoPath().projection(projection);
    g = svg.append('g');

    let tooltip = d3.select('.' + style.map_container)
      .append('div')
      .attr('class', style.hidden + ' ' + style.tooltip);
    d3.json('./data/states-10m.json').then((topology) => {
      g.selectAll('path').data(topojson.feature(topology, topology.objects.states).features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', style.path)
        .attr('fill', (d, i) => {
          return this.getAreaColor(d.properties.name);
        });

      let data = Object.keys(this.state[type]).map(i => this.state[type][i]).filter((value, index, arr) => {
        return !(value.Province_State === 'Grand Princess' || value.Province_State === 'Diamond Princess' || value.Province_State === 'American Samoa' || value.Province_State === 'American Samoa' || value.Province_State === 'Guam' || value.Province_State === 'Northern Mariana Islands' || value.Province_State === 'Puerto Rico' || value.Province_State === 'Virgin Islands');
      });

      g.selectAll('circle').data(data)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => {
          return projection([areaCenters[d.Province_State].Long, areaCenters[d.Province_State].Lat])[0];
        })
        .attr('cy', (d, i) => {
          return projection([areaCenters[d.Province_State].Long, areaCenters[d.Province_State].Lat])[1];
        })
        .attr('r', (d, i) => {
          return 0;
        })
        .attr('class', style.circle)
        .style('fill', 'rgba(255, 82, 51, 0.75)');

      g.selectAll('text').data(data)
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('class', style.number)
        .attr('x', (d, i) => {
          return projection([areaCenters[d.Province_State].Long, areaCenters[d.Province_State].Lat])[0] + 0.3;
        })
        .attr('y', (d, i) => {
          return projection([areaCenters[d.Province_State].Long, areaCenters[d.Province_State].Lat])[1] + 1;
        })
        .html('')
      let date = this.state.dates[this.state.year_month_idx].split('/');
      this.text = svg.append('text')
        .attr('alignment-baseline', 'top')
        .attr('class', style.text)
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('y', '95%')
        .html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, 0 ' + languages[l][type]);
    });
    setTimeout(() => {
      this.createInterval();
    }, 3000);
  }
  changeAreaAttributes() {
    // Change fill color.
    g.selectAll('path')
      .attr('fill', (d, i) => {
        return this.getAreaColor(d.properties.name);
      });
    g.selectAll('circle')
      .attr('r', (d, i) => {
        this.setState((state, props) => ({
          total_cases:state.total_cases + d[this.state.dates[this.state.year_month_idx]]
        }));
        return Math.log2(Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) + 1) * multiplier;
      });
    g.selectAll('text')
      .style('font-size', (d, i) => {
        return (Math.log2(Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) + 1) * (multiplier - 1)) + 'px';
      })
      .html((d, i) => {
        if (d[this.state.dates[this.state.year_month_idx]] > 0) {
          return d[this.state.dates[this.state.year_month_idx]];
        }
        else {
          return '';
        }
      });
  }
  getAreaColor(area) {
    if (this.state[type][area] !== undefined) {
      if (this.state[type][area][this.state.dates[this.state.year_month_idx]] > 0) {
        return '#808080';
      }
      else {
        return '#e5e5e5';
      }
    }
    else {
      return '#e5e5e5';
    }
  }
  onBeforeSliderChange(value) {
    if (interval) {
      clearInterval(interval)
    }
  }
  onSliderChange(value) {
    this.setState((state, props) => ({
      total_cases:0,
      year_month_idx:value
    }), this.changeAreaAttributes);
  }
  onAfterSliderChange(value) {
  }
  componentWillUnMount() {
    clearInterval(interval);
  }
  createInterval() {
    this.changeAreaAttributes();
    interval = setInterval(() => {
      this.setState((state, props) => ({
        total_cases:0,
        year_month_idx:this.state.year_month_idx + 1
      }), this.changeAreaAttributes);
      if (this.state.year_month_idx >= (this.state.dates.length - 1)) {
        clearInterval(interval);
        setTimeout(() => {
          this.setState((state, props) => ({
            total_cases:0,
            year_month_idx:0
          }), this.createInterval);
        }, 2000);
      }
    }, 1000);
  }
  render() {
    if (this.text) {
      if (this.state.dates[this.state.year_month_idx]) {
        let datetime = this.state.dates[this.state.year_month_idx].split(' ');
        let date = datetime[0].split('/');
        let time = datetime[1];
        this.text.html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, ' + this.state.total_cases + ' ' + languages[l][type]);
      }
    }
    return (
      <div className={style.plus}>
        <div>
          <Slider
            className={style.slider_container}
            dots={false}
            max={this.state.dates.length - 1}
            onAfterChange={this.onAfterSliderChange.bind(this)}
            onBeforeChange={this.onBeforeSliderChange}
            onChange={this.onSliderChange.bind(this)}
            value={this.state.year_month_idx}
          />
          <div className={style.map_container}></div>
        </div>
      </div>
    );
  }
}
export default App;