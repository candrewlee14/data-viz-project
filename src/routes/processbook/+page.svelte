<script>
  import { base } from "$app/paths";
  import * as feather from "feather-icons";
</script>

<div class="wrapper">
<div class="header">
  <div width="300">
    <a href={base + "/"}><h1>{@html feather.icons['arrow-left'].toSvg()}</h1></a>
  </div>
  <div width="300">
    <h1>Process Book</h1>
  </div>
</div>

<iframe
  title="process book"
  src="https://docs.google.com/viewer?url=https://github.com/candrewlee14/data-viz-project/raw/main/process-book/process-book-milestone-version.pdf&embedded=true"
/>
</div>

<style lang="scss">
  .header {
    height: 100px;
    display: flex;
    justify-content: center;
    box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-bottom: 2px solid rgba(0,0,0,0.1);
  }
  a {
    text-decoration: none;
    color: rgb(169, 169, 169);
    transition: color 0.2s ease;
  }
  a:hover {
    color: rgb(97, 97, 97)
  }
  h1 {
    padding: 5px 25px;
  }
  iframe {
    border-top: none;
    width: 100%;
    height: calc(100vh - 130px);
  }
  .wrapper {
    overflow: hidden;
  }
</style>
