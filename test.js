const partition = function (numChars, numPartitions, partitionNum) {
  const rawPartitionSize = numChars / numPartitions

  const partitionStart = Math.round((partitionNum - 1) * rawPartitionSize)
  const partitionEnd = Math.round((partitionNum) * rawPartitionSize)
  const partitionSize = partitionEnd - partitionStart
  const partitionChars = Array(partitionSize).fill(undefined).map((_, n) => (n + partitionStart).toString(16))

  return partitionChars.join('')
}
console.log(partition(16, 4, 0))
console.log(partition(16, 4, 1))
console.log(partition(16, 4, 2))
console.log(partition(16, 4, 3))
console.log(partition(16, 4, 4))
