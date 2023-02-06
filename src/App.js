import React, { useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import {
  Grid, Tooltip, Typography,
} from '@mui/material';

const cellWidth = "25px"
const cellHeight = "25px"
const marginPx = "3px"

const App = () => {

  const [stepCount, setStepCount] = useState(0)
  const [colorArray, setColorArray] = useState([])
  const [targetColor, setTargetColor] = useState([255, 0, 0])
  const [movesAllowed, setMovesAllowed] = useState(14)
  const [closestColor, setClosestColor] = useState([0, 0, 0])
  const [percentageMatch, setPercentageMatch] = useState(1)
  const [draggedCoordinates, setdraggedCoordinates] = useState()
  const [userId, setUserId] = useState("")
  const [GRID_SIZE, setGRID_SIZE] = useState({width: 0, height: 0})

  useEffect(() => {
    //  Call server upon load to retrieve game details
    fetch("http://localhost:9876/init")
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      setTargetColor(data.target)
      setMovesAllowed(data.maxMoves)
      setGRID_SIZE({width: data.width, height: data.height})
      setUserId(data.userId)
    })
    .catch(error => {
      console.error("There was a problem with the fetch operation:", error);
    });
  }, [])


  useEffect(() => {
    //  Calculate percentage on every step

    let percentageHolder = 1
    let r1 = targetColor[0]
    let g1 = targetColor[1]
    let b1 = targetColor[2]
    let r2 = 0
    let g2 = 0
    let b2 = 0
    let tempClosestColor = [0, 0, 0]
    if (colorArray.length > 0) {
      colorArray.map(el => {
        r2 = (el.tileColor1?.r || 0) + (el.tileColor2?.r || 0) + (el.tileColor3?.r || 0) + (el.tileColor4?.r || 0)
        g2 = (el.tileColor1?.g || 0) + (el.tileColor2?.g || 0) + (el.tileColor3?.g || 0) + (el.tileColor4?.g || 0)
        b2 = (el.tileColor1?.b || 0) + (el.tileColor2?.b || 0) + (el.tileColor3?.b || 0) + (el.tileColor4?.b || 0)
        let normalization = 255 / Math.max(r2 || 0, g2 || 0, b2 || 0, 255)
        const delta = (1 / 255) * (1 / Math.sqrt(3)) * (Math.sqrt((Math.pow(r1 - (r2 * normalization), 2)) + (Math.pow(g1 - (g2 * normalization), 2)) + (Math.pow(b1 - (b2 * normalization), 2))))
        if (delta < percentageHolder) {
          percentageHolder = delta
          tempClosestColor = [r2, g2, b2]
        }
      })
    }
    setClosestColor(tempClosestColor)
    setPercentageMatch(percentageHolder)

    if(percentageHolder <= .1) {
      //  User wins the game
      if(window.confirm("You've Won The Game, would you like to play again?")) {
        fetchDataManually()
        return
      }
    }
    if(stepCount >= movesAllowed) {
      // User loses the game
      if(window.confirm("You've lost the game, do you want to try again?")) {
        fetchDataManually()
      }
    }
  }, [stepCount])

  const fetchDataManually = () => {
    //fetch new game data after game win or lose and keep userId the same
    fetch(`http://localhost:9876/init/user/${userId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      setTargetColor(data.target)
      setMovesAllowed(data.maxMoves)
      setGRID_SIZE({width: data.width, height: data.height})
      setColorArray([])
      setStepCount(0)
      setClosestColor([0,0,0])
      setPercentageMatch(1)
      setdraggedCoordinates()
    })
    .catch(error => {
      console.error("There was a problem with the fetch operation:", error);
    });
  }
  

  const handleChangeColor = (height, width, r, g, b) => {
    //handle color change for each tile
    let stepColorMatch = { r, g, b }
    if (stepCount < 3) {
      stepColorMatch = stepCount == 0 ? { r: 255, g: 0, b: 0 } :
        stepCount == 1 ? { r: 0, g: 255, b: 0 } :
          { r: 0, g: 0, b: 255 }
    }
    let tileColorDynamic = height === 0 ? "tileColor1" :
      height == GRID_SIZE.height + 1 ? "tileColor2" :
        width === 0 ? "tileColor3" :
          width === GRID_SIZE.width + 1 ? "tileColor4" :
            null
    let Arr1 = []
    let Arr2 = []

    // ****** Handle color change when source is at the top ******
      if (height === 0) {
        for (let i = 0; i < GRID_SIZE.height; i++) {
          Arr2.push({
            height: height + (1 + i),
            width: width,
            [tileColorDynamic]: {
              r: stepColorMatch.r * ((GRID_SIZE.height + 1 - (i + 1)) / (GRID_SIZE.height + 1)),
              g: stepColorMatch.g * ((GRID_SIZE.height + 1 - (i + 1)) / (GRID_SIZE.height + 1)),
              b: stepColorMatch.b * ((GRID_SIZE.height + 1 - (i + 1)) / (GRID_SIZE.height + 1))
            }
          })
        }
      }

      // ****** Handle color change when source is at the bottom ******
      if (height == GRID_SIZE.height + 1) {
        for (let i = 0; i < GRID_SIZE.height; i++) {
          Arr2.push({
            height: height - (1 + i),
            width: width,
            [tileColorDynamic]: {
              r: stepColorMatch.r * ((GRID_SIZE.height + 1 - (i + 1)) / (GRID_SIZE.height + 1)),
              g: stepColorMatch.g * ((GRID_SIZE.height + 1 - (i + 1)) / (GRID_SIZE.height + 1)),
              b: stepColorMatch.b * ((GRID_SIZE.height + 1 - (i + 1)) / (GRID_SIZE.height + 1))
            }
          })
        }
      }

      // ****** Handle color change when source is at the left ******
      if (width == 0) {
        for (let i = 0; i < GRID_SIZE.width; i++) {
          Arr2.push({
            height: height,
            width: width + (1 + i),
            [tileColorDynamic]: {
              r: stepColorMatch.r * ((GRID_SIZE.width + 1 - (i + 1)) / (GRID_SIZE.width + 1)),
              g: stepColorMatch.g * ((GRID_SIZE.width + 1 - (i + 1)) / (GRID_SIZE.width + 1)),
              b: stepColorMatch.b * ((GRID_SIZE.width + 1 - (i + 1)) / (GRID_SIZE.width + 1))
            }
          })
        }
      }

      // ****** Handle color change when source is at the right ******
      if (width == GRID_SIZE.width + 1) {
        for (let i = 0; i < GRID_SIZE.width; i++) {
          Arr2.push({
            height: height,
            width: width - (1 + i),
            [tileColorDynamic]: {
              r: stepColorMatch.r * ((GRID_SIZE.width + 1 - (i + 1)) / (GRID_SIZE.width + 1)),
              g: stepColorMatch.g * ((GRID_SIZE.width + 1 - (i + 1)) / (GRID_SIZE.width + 1)),
              b: stepColorMatch.b * ((GRID_SIZE.width + 1 - (i + 1)) / (GRID_SIZE.width + 1))
            }
          })
        }
      }
      // Create, Add or edit objects in colorArray
      Arr1 = [...colorArray]
      let findSourceIndex = colorArray.findIndex(colorObj => height === colorObj.height && width === colorObj.width)
      if(findSourceIndex === -1) {
        Arr1 = [...colorArray].concat([{ height: height, width: width, sourceColor: stepColorMatch }])
      } else {
        Arr1[findSourceIndex].sourceColor = stepColorMatch
      }

      Arr2.map(newColorObj => {
        var foundIndex = Arr1.findIndex(oldColorObj => oldColorObj.height === newColorObj.height && oldColorObj.width === newColorObj.width);
        if(foundIndex != -1) {
          Arr1[foundIndex][tileColorDynamic] = newColorObj[tileColorDynamic];
        } else{
          Arr1.push(newColorObj)
        }
      })
      setColorArray(Arr1)
      setStepCount(stepCount + 1)
  }

  const clickHelperFunction = (height, width) => {
    // Handle Source click first 3 steps
    if (stepCount < 3) {
      handleChangeColor(height, width)
    }
  }

  const renderCell = (height, width) => {
    //Corner cell -> Do not render cell
    let key = height.toString() + width.toString()
    if (
      (height == GRID_SIZE.height + 1 && width == GRID_SIZE.width + 1) ||
      (height == 0 && width == 0) ||
      (height == 0 && width == GRID_SIZE.width + 1) ||
      (height == GRID_SIZE.height + 1 && width == 0)
    ) {
      return (
        <div
          key={key}
          style={{ 
            backgroundColor: 'white', 
            height: cellHeight, 
            width: cellWidth, 
            margin: marginPx, 
            borderRadius: '25px' 
          }}
        />
      )
    }

    // ******* Source cell -> render circle cells ********
    else if (
      (height == GRID_SIZE.height + 1) ||
      (width == GRID_SIZE.width + 1) ||
      (height == 0) ||
      (width == 0)
    ) {
      let tempColor = { r: 0, g: 0, b: 0 }
      let space = colorArray.find(el => {
        if (el.height == height && el.width == width && el.sourceColor) {
          tempColor = el.sourceColor
          return true
        }
      })
      return (
        <Tooltip key={key} title={`rgb(${Math.round(tempColor.r)}, ${Math.round(tempColor.g)}, ${Math.round(tempColor.b)}`} placement="top" arrow disableInteractive >
          <div
            onDragEnter={() => setdraggedCoordinates([height, width])}
            style={{
              backgroundColor: 'rgb(' + tempColor.r + ',' + tempColor.g + ',' + tempColor.b + ')',
              height: cellHeight,
              width: cellWidth,
              margin: marginPx,
              borderRadius: '25px'
            }}
            onClick={() => clickHelperFunction(height, width)} >
          </div>
        </Tooltip>
      )
    }

    // ******* Tile cell -> render square cells ********
    let normalization = 1
    let r = 0
    let g = 0
    let b = 0
    let tempTileColor = `rgb(${r}, ${g}, ${b})`
    colorArray.map(el => {
      if (el.height == height && el.width == width) {
        r = (el.tileColor1?.r || 0) + (el.tileColor2?.r || 0) + (el.tileColor3?.r || 0) + (el.tileColor4?.r || 0)
        g = (el.tileColor1?.g || 0) + (el.tileColor2?.g || 0) + (el.tileColor3?.g || 0)+ (el.tileColor4?.g || 0)
        b = (el.tileColor1?.b || 0) + (el.tileColor2?.b || 0) + (el.tileColor3?.b || 0) + (el.tileColor4?.b || 0)
        normalization = 255 / Math.max(r, g, b, 255)
        tempTileColor = `rgb(${Math.round(r * normalization)}, ${Math.round(g * normalization)}, ${Math.round(b * normalization)})`
        
        return
      }
    })
    const handleDragAndDrop = () => {
      // ***** Handle Source dropped from one of the tiles ******
      if (stepCount < 2) {
        return true
      }
      handleChangeColor(draggedCoordinates[0], draggedCoordinates[1], r, g, b)
    }
    return (
      <Tooltip key={key} title={tempTileColor} placement="top" arrow disableInteractive>
        <div
          draggable={stepCount > 2}
          onDragEnd={handleDragAndDrop}
          style={{
            backgroundColor: tempTileColor,
            height: cellHeight,
            width: cellWidth,
            margin: marginPx,
            border: (r == 0 && g == 0 & b == 0 ? null : r == closestColor[0] && g == closestColor[1] && b == closestColor[2]) ? '2px solid rgb(255,0,0)' : null
          }}
        >
        </div>
      </Tooltip>
    )
  }


  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="md" >

        {/* ************ Header and Title ***********/}
        <Grid item container alignItems="center">
          <Typography variant="h6">RGB Alchemy</Typography>
        </Grid>
        <Grid item container alignItems="center">
          <Typography>User ID: {userId}</Typography>
        </Grid>
        <Grid item container>
          <Typography>Moves Left: {movesAllowed - stepCount}</Typography>
        </Grid>
        <Grid item container flexDirection="row" alignItems="center">
          <Grid item>
            <Typography>Target Color: </Typography>
          </Grid>
          <Grid item>
            <Tooltip title={`rgb(${targetColor[0]}, ${targetColor[1]}, ${targetColor[2]}`} placement="top" arrow disableInteractive>
              <div
                style={{
                  backgroundColor: `rgb(${targetColor[0]}, ${targetColor[1]}, ${targetColor[2]}`,
                  height: cellHeight,
                  width: cellWidth,
                  margin: marginPx
                }}
              >
              </div>
            </Tooltip>
          </Grid>
        </Grid>
        <Grid item container flexDirection="row" alignItems="center">
          <Grid item>
            <Typography>Closest Color: </Typography>
          </Grid>
          <Grid item>
            <Tooltip title={`rgb(${Math.round(closestColor[0])}, ${Math.round(closestColor[1])}, ${Math.round(closestColor[2])})`} placement="top" arrow disableInteractive>
              <div
                style={{
                  backgroundColor: `rgb(${closestColor[0]}, ${closestColor[1]}, ${closestColor[2]})`,
                  height: cellHeight,
                  width: cellWidth,
                  margin: marginPx
                }}
              >
              </div>
            </Tooltip>
          </Grid>
          <Grid item>
            <Typography>{Math.round((percentageMatch * 100) * 100) / 100}%</Typography>
          </Grid>
        </Grid>

        {/* ******** Render cells ********* */}
        <Grid item container
          alignItems="center"
          justifyContent="center"
          alignContent="center"
        >
          {Array.from({ length: GRID_SIZE.width + 2 }, (_, width) => (
            <Grid
              item
              key={width}
            >
              {Array.from({ length: GRID_SIZE.height + 2 }, (_, height) => (
                renderCell(height, width)
              ))}
            </Grid>
          ))}
        </Grid>
      </Container>
    </React.Fragment >
  );
};

export default App;
