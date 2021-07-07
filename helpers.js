const elementIndexRegex = /([a-zA-Z0-9\\-]*)\[(\d)\]/

// This function handles arrays and objects
function replacePackageName (manifest, oldPackageName, newPackageName) {
  function recursiveReplace (objSource) {
    // if it is a string we check if we replace if it fits the package name
    if (typeof objSource === 'string' && objSource.includes(oldPackageName)) {
      return objSource.replace(oldPackageName, newPackageName)
    }

    // for objects we go deeper
    if (typeof objSource === 'object') {
      if (objSource === null) {
        return null
      }

      Object.keys(objSource).forEach(function (property) {
        objSource[property] = recursiveReplace(objSource[property])
      })

      return objSource
    }

    // in all other cases we just keep the value as is
    return objSource
  }

  return recursiveReplace(manifest)
}

function goDeeper (elements, element) {
  let elementIndex = null
  const matcher = element.match(elementIndexRegex)
  if (matcher) {
    elementIndex = Number(matcher[2])
    element = matcher[1]
  }

  let resultElement = null

  // check if the element just directly exists
  if (elements[element]) {
    resultElement = elements[element]
  } else {
    // if not we are dealing with an array, we have to check if our element is in there
    for (const k in elements) {
      if (elements[k].name === element) {
        resultElement = elements[k]
        break
      }
    }

    // because of the format of the file we have to also check if there is a child array
    if (elements.child) {
      elements = elements.child
      let count = 0
      for (const k in elements) {
        if (!elements[k].element) { // this could be a text node, we can not check those
          continue
        }
        if (elements[k].element.name === element) {
          if (elementIndex === null || elementIndex === count) {
            return elements[k].element
          }
          count++
        }
      }
    }
  }

  if (elementIndex !== null) {
    return resultElement[elementIndex]
  }
  return resultElement
}

function getElementsAtPath (manifest, path) {
  const pathElements = path.split('.')

  // the root manifestt always starts with an `element` object
  for (let i = 0; i < pathElements.length; i++) {
    manifest = goDeeper(manifest, pathElements[i])
    if (manifest === null) {
      // means the path is wrong
      throw new Error(`element does not exist ${pathElements[i]}`)
    }
  }

  return manifest
}

function setElementsAtPath (manifest, path, attributeMap) {
  manifest = getElementsAtPath(manifest, path)

  for (const k in attributeMap) {
    const attributeElements = k.split('.')
    let dataToEdit = manifest
    for (let i = 0; i < attributeElements.length; i++) {
      dataToEdit = goDeeper(dataToEdit, attributeElements[i])
    }
    dataToEdit.value = attributeMap[k]
  }
}

function deletePermission (manifest, permission) {
  for (const k in manifest.element.child) {
    if (manifest.element.child[k].element && manifest.element.child[k].element.name === 'uses-permission' && manifest.element.child[k].element.attribute[0].value === permission) {
      manifest.element.child.splice(k, 1)
      return
    }
  }
}

function deleteActivityByName (manifest, name) {
  manifest = getElementsAtPath(manifest, 'element.application')

  for (const k in manifest.child) {
    if (manifest.child[k].element && manifest.child[k].element.name === 'activity') {
      for (const attrIdx in manifest.child[k].element.attribute) {
        if (manifest.child[k].element.attribute[attrIdx].value === name) {
          delete manifest.child[k].element
          return
        }
      }
    }
  }
}

module.exports = {
  replacePackageName,
  getElementsAtPath,
  setElementsAtPath,
  deleteActivityByName,
  deletePermission
}
