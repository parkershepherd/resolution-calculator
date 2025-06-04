<script setup lang="ts">
import Configuration from './Configuration.vue'
</script>

<script lang="ts">
import { ref } from 'vue'
import * as d3 from 'd3'

const distance = ref(9)

const fovCutoffs = {
  min: 15,
  idealMin: 35, idealMessage: 'THX recommendation (35+)', idealLabel: 'THX',
  overkillMin: 60, overkillMessage: 'IMAX minimum (60+)', overkillLabel: 'IMAX',
  max: 65,
}

const ppdCutoffs = {
  min: 60,
  idealMin: 100, idealMessage: 'iPhone 6+ at 15"', idealLabel: 'iPhone 6+',
  overkillMin: 160, overkillMessage: 'Human eye limit (120-170)', overkillLabel: 'Human eye',
  max: 175,
}

let graphSize = 500
const axisMargin = 10
const margin = 20

export default {
  name: 'ResolutionCalculator',
  data() {
    return {
      distance,
      configurations: [{
        screenSize: 60,
        resolution: 2160,
      }],
      xScale: d3.scaleLinear()
        .domain([ ppdCutoffs.min, ppdCutoffs.max ])
        .range([axisMargin + margin, graphSize - margin])
        .clamp(true),
      yScale: d3.scaleLinear()
        .domain([ fovCutoffs.min, fovCutoffs.max ])
        .range([graphSize - axisMargin - margin, margin])
        .clamp(true),
    }
  },
  mounted: function() {
    this.initializeGraph();
  },
  created: function() {
    window.addEventListener('resize', this.initializeGraph);
  },
  destroyed: function() {
    window.removeEventListener('resize', this.initializeGraph);
  },
  methods: {
    addConfiguration() {
      const newConfig = {
        screenSize: 60,
        resolution: 2160,
      };
      this.configurations.push(
        this.configurations.length
          ? {...this.configurations[this.configurations.length - 1]}
          : newConfig
      );
      this.updateGraph();
    },
    calculateStats({ screenSize, distance, resolution }: {
      screenSize: number,
      distance: number,
      resolution: number,
    }) {
      let horizontalMultiplier = screenSize/Math.sqrt(16*16 + 9*9);
      let verticalToHorizontal = 16/9;
      let width = horizontalMultiplier * 16;
      let horizontalResolution = verticalToHorizontal * resolution;
      let fov = Math.atan( (width/2) / (distance*12) )*2 * 180/Math.PI;
      let angularResolution = 2*(distance*12)*(horizontalResolution/width) * Math.tan(0.5 * Math.PI/180);
      return {
        fov,
        angularResolution,
      }
    },
    initializeGraph() {
      const svgElement = this.$refs.svg as SVGElement
      const svg = d3.select(svgElement)
      const actualWidth = svg.node()?.clientWidth
      graphSize = actualWidth || 500; // Fallback to default size if not available
      svg.attr('height', graphSize)
      svgElement.innerHTML = ''; // Clear previous content

      this.xScale = d3.scaleLinear()
        .domain([ ppdCutoffs.min, ppdCutoffs.max ])
        .range([axisMargin + margin, graphSize - margin])
        .clamp(true)
      this.yScale = d3.scaleLinear()
        .domain([ fovCutoffs.min, fovCutoffs.max ])
        .range([graphSize - axisMargin - margin, margin])
        .clamp(true)

      const xAxis = d3.axisBottom(this.xScale).ticks(10)
      const yAxis = d3.axisLeft(this.yScale).ticks(10)

      // Create the axes
      svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${graphSize - axisMargin - margin})`)
        .call(xAxis)
      svg.append('g')

      // Draw the y-axis
        .attr('class', 'y axis')
        .attr('transform', `translate(${axisMargin + margin}, 0)`)
        .call(yAxis)
      // Draw the graph
    svg.append('g')
        .attr('class', 'graph')

      const badColor = 'lch(10% 10 160)'
      const idealColor = 'lch(50% 150 160)'
      const overkillColor = 'lch(80% 10 160)'
      
      // PPD bad area
      svg.append('rect')
        .attr('x', this.xScale(ppdCutoffs.min))
        .attr('y', this.yScale(fovCutoffs.max))
        .attr('width', this.xScale(ppdCutoffs.idealMin) - this.xScale(ppdCutoffs.min))
        .attr('height', this.yScale(fovCutoffs.min) - this.yScale(fovCutoffs.max))
        .attr('fill', badColor)
        .attr('opacity', 0.2)

      // PPD ideal area
      svg.append('rect')
        .attr('x', this.xScale(ppdCutoffs.idealMin))
        .attr('y', this.yScale(fovCutoffs.max))
        .attr('width', this.xScale(ppdCutoffs.overkillMin) - this.xScale(ppdCutoffs.idealMin))
        .attr('height', this.yScale(fovCutoffs.min) - this.yScale(fovCutoffs.max))
        .attr('fill', idealColor)
        .attr('opacity', 0.2)

      // PPD overkill area
      svg.append('rect')
        .attr('x', this.xScale(ppdCutoffs.overkillMin))
        .attr('y', this.yScale(fovCutoffs.max))
        .attr('width', this.xScale(ppdCutoffs.max) - this.xScale(ppdCutoffs.overkillMin))
        .attr('height', this.yScale(fovCutoffs.min) - this.yScale(fovCutoffs.max))
        .attr('fill', overkillColor)
        .attr('opacity', 0.2)
        
      
      // FOV bad area
      svg.append('rect')
        .attr('x', this.xScale(ppdCutoffs.min))
        .attr('y', this.yScale(fovCutoffs.idealMin))
        .attr('width', this.xScale(ppdCutoffs.max) - this.xScale(ppdCutoffs.min))
        .attr('height', this.yScale(fovCutoffs.min) - this.yScale(fovCutoffs.idealMin))
        .attr('fill', badColor)
        .attr('opacity', 0.2)
      // FOV ideal area
      svg.append('rect')
        .attr('x', this.xScale(ppdCutoffs.min))
        .attr('y', this.yScale(fovCutoffs.overkillMin))
        .attr('width', this.xScale(ppdCutoffs.max) - this.xScale(ppdCutoffs.min))
        .attr('height', this.yScale(fovCutoffs.idealMin) - this.yScale(fovCutoffs.overkillMin))
        .attr('fill', idealColor)
        .attr('opacity', 0.2)
      // FOV overkill area
      svg.append('rect')
        .attr('x', this.xScale(ppdCutoffs.min))
        .attr('y', this.yScale(fovCutoffs.max))
        .attr('width', this.xScale(ppdCutoffs.max) - this.xScale(ppdCutoffs.min))
        .attr('height', this.yScale(fovCutoffs.overkillMin) - this.yScale(fovCutoffs.max))
        .attr('fill', overkillColor)
        .attr('opacity', 0.2)


      // Draw angle icons to the left of the y axis to illustrate FOV at several locations
      const numFovIcons = 6;
      const fovMargin = 8
      for (let i = 0; i < numFovIcons; i++) {
        const fov = fovCutoffs.min + (fovCutoffs.max - fovCutoffs.min) * (i / (numFovIcons - 1));
        // Draw triangle with open facing to the right, with using the calculated angle for each
        const x = graphSize - margin + fovMargin // axisMargin + margin - fovIconNegativeMargin;
        const y = this.yScale(fov)
        // Draw 2 lines to form an angle pointing left, where the angle is the FOV
        const angle = fov * Math.PI / 180;
        const lineLength = 10;
        const x1 = x + lineLength * Math.cos(angle / 2);
        const y1 = y - lineLength * Math.sin(angle / 2);
        const x2 = x + lineLength * Math.cos(-angle / 2);
        const y2 = y - lineLength * Math.sin(-angle / 2);
        svg.append('line')
          .attr('x1', x)
          .attr('y1', y)
          .attr('x2', x1)
          .attr('y2', y1)
          .attr('stroke', 'black')
          .attr('stroke-width', 1);
        svg.append('line')
          .attr('x1', x)
          .attr('y1', y)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', 'black')
          .attr('stroke-width', 1);
      }

      let numPpdIcons = 6
      const ppdMargin = 12
      for (let i = 0; i < numPpdIcons; i++) {
        const ppd = ppdCutoffs.min + (ppdCutoffs.max - ppdCutoffs.min) * (i / (numPpdIcons - 1));
        // Draw circle with open facing to the right, with using the calculated angle for each
        const x = this.xScale(ppd)
        const y = margin - ppdMargin // graphSize - axisMargin - margin + ppdIconNegativeMargin;
        // Draw hash marks illustrating PPD with fewer hash marks for lower PPD
        const hashSize = 10
        const numHashMarks = Math.max(1, Math.floor(ppd / 20));
        const hashMarkSpacing = hashSize / (numHashMarks-1);
        for (let j = 0; j < numHashMarks; j++) {
          const hashX = x + j * hashMarkSpacing;
          const hashY = y + j * hashMarkSpacing; // 5 pixels above the baseline
          // Vertical line for each hash mark
          svg.append('line')
            .attr('x1', hashX - hashSize / 2)
            .attr('y1', y + hashSize / 2)
            .attr('x2', hashX - hashSize / 2)
            .attr('y2', y - hashSize / 2)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);
          
          // Horizontal line for each hash mark
          svg.append('line')
            .attr('x1', x - hashSize / 2)
            .attr('y1', hashY - hashSize / 2)
            .attr('x2', x + hashSize / 2)
            .attr('y2', hashY - hashSize / 2)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);
        }
      }

      const cutoffTextColor = 'lch(50% 0 160)'
      // Draw text labels for FOV and PPD cutoffs
      svg.append('text')
        .attr('x', axisMargin + margin + 5)
        .attr('y', this.yScale(fovCutoffs.idealMin) + 5)
        .text(`${fovCutoffs.idealLabel}: ${fovCutoffs.idealMin}°+`)
        .attr('fill', cutoffTextColor)
        .attr('font-size', '12px');
      svg.append('text')
        .attr('x', axisMargin + margin + 5)
        .attr('y', this.yScale(fovCutoffs.overkillMin) + 5)
        .text(`${fovCutoffs.overkillLabel}: ${fovCutoffs.overkillMin}°+`)
        .attr('fill', cutoffTextColor)
        .attr('font-size', '12px');

      svg.append('text')
        .attr('x', this.xScale(ppdCutoffs.idealMin) + 10)
        .attr('y', graphSize - margin - ppdMargin)
        .text(`${ppdCutoffs.idealLabel}: ${ppdCutoffs.idealMin} PPD+`)
        // Rotate the text to be vertical
        .attr('transform', `rotate(-90, ${this.xScale(ppdCutoffs.idealMin) + 5}, ${graphSize - margin - ppdMargin})`)
        .attr('fill', cutoffTextColor)
        .attr('font-size', '12px');
      svg.append('text')
        .attr('x', this.xScale(ppdCutoffs.overkillMin) + 10)
        .attr('y', graphSize - margin - ppdMargin)
        .text(`${ppdCutoffs.overkillLabel}: ${ppdCutoffs.overkillMin} PPD+`)
        // Rotate the text to be vertical
        .attr('transform', `rotate(-90, ${this.xScale(ppdCutoffs.overkillMin) + 5}, ${graphSize - margin - ppdMargin})`)
        .attr('fill', cutoffTextColor)
        .attr('font-size', '12px');
      this.updateGraph()
    },
    updateGraph() {
      const graph = (this.$refs.svg as SVGElement).querySelector('.graph') as HTMLElement;
      graph.innerHTML = ''; // Clear previous graph
      for (let configuration of this.configurations) {
        const stats = this.calculateStats({
          screenSize: configuration.screenSize,
          distance: this.distance,
          resolution: configuration.resolution,
        });
        const circle = d3.select(graph)
          .append('circle')
          .attr('cx', this.xScale(stats.angularResolution))
          .attr('cy', this.yScale(stats.fov))
          .attr('r', 5)
          .attr('fill', 'blue');

        const label = `FOV: ${stats.fov.toFixed(2)}°, Angular Resolution: ${stats.angularResolution.toFixed(2)}°`
        circle.append('title').text(label);

        d3.select(graph)
          .append('text')
          .attr('x', this.xScale(stats.angularResolution) + 10)
          .attr('y', this.yScale(stats.fov))
          .text(`${configuration.screenSize}" [${configuration.resolution}p]`)
          .attr('fill', 'black')
          .attr('font-size', '12px');
      }
    },
  },
  watch: {
    configurations: 'updateGraph',
    distance: 'updateGraph',
  },
}
</script>

<template>
  <h1 class="text-4xl mb-8">What TV should I buy?</h1>
  <div class="flex justify-center">
    <svg ref="svg" width="100%" height="100%"></svg>
  </div>
  <div class="my-4">
    <!-- <h2 class="text-xl">Configuration</h2> -->
    <div class="m-2">
      <label for="distance" class="mr-2">Viewing distance (feet): <pre class="inline">{{ distance }}'</pre></label>
      <br/>
      <input id="distance" type="range" min="5" max="20" step="0.25" v-model="distance" />
    </div>
    <div v-for="configuration in configurations">
      <Configuration
        class="m-2"
        :screenSize="configuration.screenSize"
        @update:screen-size="configuration.screenSize = $event; updateGraph()"
        :resolution="configuration.resolution"
        @update:resolution="configuration.resolution = $event; updateGraph()"
        @delete="configurations = configurations.filter(c => c !== configuration)"
      />
    </div>
    <button
      class="bg-green-500 py-1 px-4 rounded-sm text-white m-2 mt-1 cursor-pointer"
      @click="addConfiguration">
      Add
    </button>
  </div>
</template>

<style scoped>
</style>
