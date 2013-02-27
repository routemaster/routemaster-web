{
    baseUrl: "${basedir}/src/js", // module names are relative to baseUrl
    dir: "${basedir}/bin/js", // the output directory
    optimize: "none", // can be "uglify2" or "closure"
    
    modules: [
        {
            name: "debug"
        }
    ]
}
