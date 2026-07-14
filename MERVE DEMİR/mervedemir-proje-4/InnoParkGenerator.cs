using UnityEngine;

public class InnoParkGenerator : MonoBehaviour
{
    private Transform root;

    private Material whiteMat;
    private Material offWhiteMat;
    private Material glassMat;
    private Material darkGlassMat;
    private Material greenMat;
    private Material signGreenMat;
    private Material asphaltMat;
    private Material concreteMat;
    private Material grassMat;
    private Material brownMat;
    private Material blackMat;
    private Material metalMat;
    private Material redMat;

    [ContextMenu("Generate InnoPark Blockout")]
    public void Generate()
    {
        ClearOldModel();
        CreateMaterials();

        GameObject rootObj = new GameObject("INNOPARK_BLOCKOUT_MODEL");
        root = rootObj.transform;

        CreateGroundAndRoads();
        CreateBuildingMasses();
        CreateCurvedGlassEntrance();
        CreateMainEntranceDetails();
        CreateInnoParkSigns();
        CreateWindowsAndFacadeLines();
        CreateRoofDetails();
        CreateParkingAndCars();
        CreateLandscape();
        CreateLightingAndCamera();
    }

    private void ClearOldModel()
    {
        GameObject old = GameObject.Find("INNOPARK_BLOCKOUT_MODEL");

        if (old != null)
        {
            if (Application.isPlaying)
                Destroy(old);
            else
                DestroyImmediate(old);
        }
    }

    private void CreateMaterials()
    {
        whiteMat = MakeMat("White_Facade", new Color(0.93f, 0.93f, 0.88f));
        offWhiteMat = MakeMat("Warm_White_Facade", new Color(0.82f, 0.80f, 0.72f));
        glassMat = MakeMat("InnoPark_Blue_Glass", new Color(0.02f, 0.28f, 0.46f, 0.62f), true);
        darkGlassMat = MakeMat("Dark_Blue_Window_Glass", new Color(0.015f, 0.08f, 0.15f));
        greenMat = MakeMat("Landscape_Green", new Color(0.10f, 0.48f, 0.12f));
        signGreenMat = MakeMat("InnoPark_Sign_Green", new Color(0.00f, 0.42f, 0.20f));
        asphaltMat = MakeMat("Asphalt_Road", new Color(0.08f, 0.08f, 0.08f));
        concreteMat = MakeMat("Concrete_Plaza", new Color(0.62f, 0.62f, 0.56f));
        grassMat = MakeMat("Grass_Ground", new Color(0.20f, 0.55f, 0.16f));
        brownMat = MakeMat("Brown_Facade_Panels", new Color(0.42f, 0.20f, 0.10f));
        blackMat = MakeMat("Black_Detail", new Color(0.02f, 0.02f, 0.02f));
        metalMat = MakeMat("Light_Metal", new Color(0.72f, 0.72f, 0.68f));
        redMat = MakeMat("Red_Car", new Color(0.65f, 0.05f, 0.04f));
    }

    private Material MakeMat(string name, Color color, bool transparent = false)
    {
        Shader shader = Shader.Find("Universal Render Pipeline/Lit");

        if (shader == null)
            shader = Shader.Find("Standard");

        Material mat = new Material(shader);
        mat.name = name;
        mat.color = color;

        if (transparent)
        {
            mat.SetFloat("_Surface", 1);
            mat.SetFloat("_AlphaClip", 0);
            mat.SetFloat("_Blend", 0);
            mat.SetFloat("_SrcBlend", (float)UnityEngine.Rendering.BlendMode.SrcAlpha);
            mat.SetFloat("_DstBlend", (float)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            mat.SetFloat("_ZWrite", 0);
            mat.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            mat.renderQueue = 3000;
        }

        return mat;
    }

    private GameObject Cube(string name, Vector3 position, Vector3 scale, Material mat)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
        obj.name = name;
        obj.transform.SetParent(root);
        obj.transform.position = position;
        obj.transform.localScale = scale;

        if (mat != null)
            obj.GetComponent<Renderer>().material = mat;

        return obj;
    }

    private GameObject Cylinder(string name, Vector3 position, Vector3 scale, Material mat)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        obj.name = name;
        obj.transform.SetParent(root);
        obj.transform.position = position;
        obj.transform.localScale = scale;

        if (mat != null)
            obj.GetComponent<Renderer>().material = mat;

        return obj;
    }

    private GameObject Sphere(string name, Vector3 position, Vector3 scale, Material mat)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        obj.name = name;
        obj.transform.SetParent(root);
        obj.transform.position = position;
        obj.transform.localScale = scale;

        if (mat != null)
            obj.GetComponent<Renderer>().material = mat;

        return obj;
    }

    private void CreateGroundAndRoads()
    {
        Cube("Ground_Zemin", new Vector3(0, -0.05f, 0), new Vector3(115, 0.1f, 100), grassMat);

        Cube("Plaza_OnBetonAlan", new Vector3(0, 0.02f, -20), new Vector3(48, 0.08f, 21), concreteMat);

        Cube("Road_AnaYol", new Vector3(0, 0.04f, -38), new Vector3(92, 0.09f, 9), asphaltMat);
        Cube("Road_GirisYolu", new Vector3(0, 0.05f, -27), new Vector3(11, 0.09f, 17), asphaltMat);

        Cube("Road_SolKenarCizgisi", new Vector3(-25, 0.12f, -38), new Vector3(25, 0.04f, 0.14f), whiteMat);
        Cube("Road_SagKenarCizgisi", new Vector3(25, 0.12f, -38), new Vector3(25, 0.04f, 0.14f), whiteMat);
        Cube("Road_OrtaCizgi", new Vector3(0, 0.13f, -38), new Vector3(12, 0.04f, 0.12f), whiteMat);

        Cube("Garden_OrtaAda", new Vector3(0, 0.12f, -27.5f), new Vector3(7.5f, 0.16f, 3.4f), grassMat);
    }

    private void CreateBuildingMasses()
    {
        Cube("MainBuilding_AnaGovde", new Vector3(0, 4.2f, 0), new Vector3(28, 8.4f, 16), whiteMat);

        Cube("A_Block_SolYuksekBlok", new Vector3(-19.5f, 5.3f, -0.7f), new Vector3(9, 10.6f, 15), whiteMat);

        Cube("B_Block_SagOfisKanadi", new Vector3(21, 3.8f, 0.5f), new Vector3(22, 7.6f, 13.5f), whiteMat);

        Cube("RearWing_ArkaUzunKanat", new Vector3(4, 3.2f, 14.4f), new Vector3(38, 6.4f, 8.2f), whiteMat);

        Cube("UpperFloor_UstKatKütle", new Vector3(1.5f, 9.2f, 2.2f), new Vector3(20, 3.2f, 12.5f), offWhiteMat);

        Cube("Facade_GreenHorizontalBand_Left", new Vector3(-19.5f, 2.15f, -8.31f), new Vector3(8.2f, 0.28f, 0.12f), signGreenMat);
        Cube("Facade_GreenHorizontalBand_Main", new Vector3(2.5f, 2.15f, -8.31f), new Vector3(24f, 0.28f, 0.12f), signGreenMat);
        Cube("Facade_GreenHorizontalBand_Right", new Vector3(21f, 2.15f, -6.35f), new Vector3(20f, 0.28f, 0.12f), signGreenMat);

        Cube("Facade_BrownVerticalPanel_01", new Vector3(-12.7f, 4.8f, -8.37f), new Vector3(0.35f, 7.4f, 0.18f), brownMat);
        Cube("Facade_BrownVerticalPanel_02", new Vector3(13.1f, 4.8f, -8.37f), new Vector3(0.35f, 7.4f, 0.18f), brownMat);
        Cube("Facade_BrownVerticalPanel_03", new Vector3(31.9f, 4.0f, -6.35f), new Vector3(0.35f, 5.6f, 0.18f), brownMat);
    }

    private void CreateCurvedGlassEntrance()
    {
        int segments = 32;

        float halfWidth = 12.5f;
        float depth = 7.2f;
        float frontZ = -8.4f;
        float bottomY = 0.8f;
        float topY = 9.2f;

        Mesh mesh = new Mesh();

        Vector3[] vertices = new Vector3[(segments + 1) * 2];
        int[] triangles = new int[segments * 6];

        for (int i = 0; i <= segments; i++)
        {
            float t = i / (float)segments;
            float angle = Mathf.PI * t;

            float x = Mathf.Cos(angle) * halfWidth;
            float z = frontZ - Mathf.Sin(angle) * depth;

            vertices[i * 2] = new Vector3(x, bottomY, z);
            vertices[i * 2 + 1] = new Vector3(x, topY, z);
        }

        int tri = 0;

        for (int i = 0; i < segments; i++)
        {
            int a = i * 2;
            int b = a + 1;
            int c = a + 2;
            int d = a + 3;

            triangles[tri++] = a;
            triangles[tri++] = b;
            triangles[tri++] = c;

            triangles[tri++] = c;
            triangles[tri++] = b;
            triangles[tri++] = d;
        }

        mesh.vertices = vertices;
        mesh.triangles = triangles;
        mesh.RecalculateNormals();

        GameObject facade = new GameObject("GlassFacade_KavisliMaviCamCephe");
        facade.transform.SetParent(root);

        MeshFilter mf = facade.AddComponent<MeshFilter>();
        MeshRenderer mr = facade.AddComponent<MeshRenderer>();

        mf.mesh = mesh;
        mr.material = glassMat;

        for (int i = 0; i <= 12; i++)
        {
            float t = i / 12f;
            float angle = Mathf.PI * t;

            float x = Mathf.Cos(angle) * halfWidth;
            float z = frontZ - Mathf.Sin(angle) * depth;

            GameObject verticalBar = Cube("GlassFrame_DikeyBeyazCita", new Vector3(x, 5.0f, z - 0.04f), new Vector3(0.16f, 8.6f, 0.22f), whiteMat);
            verticalBar.transform.rotation = Quaternion.Euler(0, -90 + angle * Mathf.Rad2Deg, 0);
        }

        for (int y = 2; y <= 8; y += 2)
        {
            CreateCurvedHorizontalGlassBar("GlassFrame_YatayBeyazCita_" + y, y, halfWidth, depth, frontZ);
        }
    }

    private void CreateCurvedHorizontalGlassBar(string name, float y, float halfWidth, float depth, float frontZ)
    {
        int segments = 32;

        Mesh mesh = new Mesh();
        Vector3[] vertices = new Vector3[(segments + 1) * 2];
        int[] triangles = new int[segments * 6];

        float thickness = 0.13f;

        for (int i = 0; i <= segments; i++)
        {
            float t = i / (float)segments;
            float angle = Mathf.PI * t;

            float x = Mathf.Cos(angle) * halfWidth;
            float z = frontZ - Mathf.Sin(angle) * depth;

            vertices[i * 2] = new Vector3(x, y - thickness, z - 0.06f);
            vertices[i * 2 + 1] = new Vector3(x, y + thickness, z - 0.06f);
        }

        int tri = 0;

        for (int i = 0; i < segments; i++)
        {
            int a = i * 2;
            int b = a + 1;
            int c = a + 2;
            int d = a + 3;

            triangles[tri++] = a;
            triangles[tri++] = b;
            triangles[tri++] = c;

            triangles[tri++] = c;
            triangles[tri++] = b;
            triangles[tri++] = d;
        }

        mesh.vertices = vertices;
        mesh.triangles = triangles;
        mesh.RecalculateNormals();

        GameObject bar = new GameObject(name);
        bar.transform.SetParent(root);

        MeshFilter mf = bar.AddComponent<MeshFilter>();
        MeshRenderer mr = bar.AddComponent<MeshRenderer>();

        mf.mesh = mesh;
        mr.material = whiteMat;
    }

    private void CreateMainEntranceDetails()
    {
        Cube("Entrance_GirisKapisi_Cam", new Vector3(0, 1.8f, -15.55f), new Vector3(4.1f, 3.2f, 0.2f), darkGlassMat);
        Cube("Entrance_GirisKapisi_SolKanat", new Vector3(-1.05f, 1.8f, -15.72f), new Vector3(0.08f, 3.0f, 0.15f), metalMat);
        Cube("Entrance_GirisKapisi_SagKanat", new Vector3(1.05f, 1.8f, -15.72f), new Vector3(0.08f, 3.0f, 0.15f), metalMat);
        Cube("Entrance_GirisKapisi_UstCerceve", new Vector3(0, 3.45f, -15.72f), new Vector3(4.8f, 0.22f, 0.18f), whiteMat);

        Cube("Entrance_OnSacak_Beyaz", new Vector3(0, 4.05f, -16.2f), new Vector3(8.5f, 0.32f, 3.0f), whiteMat);
        Cube("Entrance_Sacak_Golge", new Vector3(0, 3.82f, -16.4f), new Vector3(7.6f, 0.12f, 2.5f), offWhiteMat);

        Cylinder("Entrance_SolKolon", new Vector3(-3.8f, 1.95f, -16.2f), new Vector3(0.22f, 1.95f, 0.22f), whiteMat);
        Cylinder("Entrance_SagKolon", new Vector3(3.8f, 1.95f, -16.2f), new Vector3(0.22f, 1.95f, 0.22f), whiteMat);

        Cube("Entrance_Basamak_01", new Vector3(0, 0.18f, -16.7f), new Vector3(6.5f, 0.25f, 1.1f), concreteMat);
        Cube("Entrance_Basamak_02", new Vector3(0, 0.34f, -17.35f), new Vector3(7.5f, 0.22f, 1.0f), concreteMat);
    }

    private void CreateInnoParkSigns()
    {
        Cube("InnoPark_MainSign_ArkaPanel", new Vector3(-19.5f, 7.4f, -8.48f), new Vector3(7.6f, 2.25f, 0.12f), whiteMat);

        GameObject sign = new GameObject("InnoPark_MainSign_Yazi");
        sign.transform.SetParent(root);
        sign.transform.position = new Vector3(-19.5f, 7.45f, -8.62f);
        sign.transform.rotation = Quaternion.Euler(0, 0, 0);

        TextMesh text = sign.AddComponent<TextMesh>();
        text.text = "InnoPark";
        text.anchor = TextAnchor.MiddleCenter;
        text.alignment = TextAlignment.Center;
        text.characterSize = 0.62f;
        text.fontSize = 96;
        text.color = new Color(0.0f, 0.42f, 0.20f);

        Cube("InnoPark_MainSign_AltYesilCizgi", new Vector3(-19.5f, 6.15f, -8.63f), new Vector3(7.0f, 0.18f, 0.08f), signGreenMat);

        Cube("InnoPark_VerticalSign_BeyazPanel", new Vector3(-24.15f, 5.7f, -8.55f), new Vector3(1.2f, 7.8f, 0.16f), whiteMat);

        GameObject verticalText = new GameObject("InnoPark_VerticalSign_Yazi");
        verticalText.transform.SetParent(root);
        verticalText.transform.position = new Vector3(-24.2f, 5.7f, -8.72f);
        verticalText.transform.rotation = Quaternion.Euler(0, 0, 90);

        TextMesh vText = verticalText.AddComponent<TextMesh>();
        vText.text = "InnoPark";
        vText.anchor = TextAnchor.MiddleCenter;
        vText.alignment = TextAlignment.Center;
        vText.characterSize = 0.42f;
        vText.fontSize = 86;
        vText.color = new Color(0.0f, 0.42f, 0.20f);

        Cube("InnoPark_VerticalSign_YesilSerit", new Vector3(-24.85f, 5.7f, -8.73f), new Vector3(0.22f, 7.2f, 0.08f), signGreenMat);
    }

    private void CreateWindowsAndFacadeLines()
    {
        for (int i = 0; i < 4; i++)
        {
            float x = -22.5f + i * 1.9f;
            Cube("Window_A_Block_DikeyCam_" + (i + 1), new Vector3(x, 4.7f, -8.55f), new Vector3(1.05f, 4.6f, 0.18f), darkGlassMat);
        }

        for (int i = 0; i < 8; i++)
        {
            float x = 11.8f + i * 2.1f;
            Cube("Window_B_Block_AltSira_" + (i + 1), new Vector3(x, 3.2f, -6.45f), new Vector3(1.25f, 1.7f, 0.18f), darkGlassMat);
            Cube("Window_B_Block_UstSira_" + (i + 1), new Vector3(x, 5.7f, -6.45f), new Vector3(1.25f, 1.7f, 0.18f), darkGlassMat);
        }

        for (int i = 0; i < 7; i++)
        {
            float x = -6.5f + i * 2.2f;
            Cube("Window_UpperFloor_OnCephe_" + (i + 1), new Vector3(x, 9.35f, -4.35f), new Vector3(1.35f, 1.25f, 0.18f), darkGlassMat);
        }

        for (int i = 0; i < 9; i++)
        {
            float x = -12f + i * 3f;
            Cube("Facade_ThinShadowLine_Main_" + (i + 1), new Vector3(x, 8.25f, -8.43f), new Vector3(0.08f, 1.2f, 0.08f), offWhiteMat);
        }

        Cube("Facade_LeftVerticalEdge", new Vector3(-14f, 4.1f, -8.44f), new Vector3(0.13f, 7.8f, 0.08f), offWhiteMat);
        Cube("Facade_RightVerticalEdge", new Vector3(14f, 4.1f, -8.44f), new Vector3(0.13f, 7.8f, 0.08f), offWhiteMat);
    }

    private void CreateRoofDetails()
    {
        CreateCurvedRoofCanopy();

        Cube("Roof_AnaDuzCati", new Vector3(0, 8.55f, 0), new Vector3(29, 0.35f, 16.5f), offWhiteMat);
        Cube("Roof_SolBlokCati", new Vector3(-19.5f, 10.75f, -0.7f), new Vector3(9.5f, 0.35f, 15.5f), offWhiteMat);
        Cube("Roof_SagBlokCati", new Vector3(21, 7.8f, 0.5f), new Vector3(22.5f, 0.35f, 14f), offWhiteMat);

        Cube("Roof_Parapet_OnCephe", new Vector3(0, 9.15f, -8.4f), new Vector3(28.8f, 0.7f, 0.35f), whiteMat);
        Cube("Roof_Parapet_SolBlok", new Vector3(-19.5f, 11.25f, -8.35f), new Vector3(9.4f, 0.7f, 0.35f), whiteMat);
        Cube("Roof_Parapet_SagBlok", new Vector3(21, 8.25f, -6.4f), new Vector3(22.5f, 0.65f, 0.35f), whiteMat);
    }

    private void CreateCurvedRoofCanopy()
    {
        int segments = 32;

        float outerHalfWidth = 15.2f;
        float innerHalfWidth = 10.5f;
        float outerDepth = 8.4f;
        float innerDepth = 4.8f;
        float frontZ = -8.4f;
        float y = 9.65f;

        Mesh mesh = new Mesh();

        Vector3[] vertices = new Vector3[(segments + 1) * 2];
        int[] triangles = new int[segments * 6];

        for (int i = 0; i <= segments; i++)
        {
            float t = i / (float)segments;
            float angle = Mathf.PI * t;

            float outerX = Mathf.Cos(angle) * outerHalfWidth;
            float outerZ = frontZ - Mathf.Sin(angle) * outerDepth;

            float innerX = Mathf.Cos(angle) * innerHalfWidth;
            float innerZ = frontZ - Mathf.Sin(angle) * innerDepth;

            vertices[i * 2] = new Vector3(outerX, y, outerZ);
            vertices[i * 2 + 1] = new Vector3(innerX, y, innerZ);
        }

        int tri = 0;

        for (int i = 0; i < segments; i++)
        {
            int a = i * 2;
            int b = a + 1;
            int c = a + 2;
            int d = a + 3;

            triangles[tri++] = a;
            triangles[tri++] = b;
            triangles[tri++] = c;

            triangles[tri++] = c;
            triangles[tri++] = b;
            triangles[tri++] = d;
        }

        mesh.vertices = vertices;
        mesh.triangles = triangles;
        mesh.RecalculateNormals();

        GameObject roof = new GameObject("Roof_KavisliBeyazCamCepheSacagi");
        roof.transform.SetParent(root);

        MeshFilter mf = roof.AddComponent<MeshFilter>();
        MeshRenderer mr = roof.AddComponent<MeshRenderer>();

        mf.mesh = mesh;
        mr.material = whiteMat;
    }

    private void CreateParkingAndCars()
    {
        for (int i = 0; i < 9; i++)
        {
            float x = -34 + i * 8.5f;
            Cube("ParkingLine_OtoparkCizgisi_" + (i + 1), new Vector3(x, 0.13f, -34.2f), new Vector3(0.12f, 0.04f, 5.6f), whiteMat);
        }

        CreateCar("Car_01_Beyaz", new Vector3(-24, 0.45f, -35), whiteMat);
        CreateCar("Car_02_Gri", new Vector3(-12, 0.45f, -35), metalMat);
        CreateCar("Car_03_Kirmizi", new Vector3(4, 0.45f, -35), redMat);
        CreateCar("Car_04_Beyaz", new Vector3(17, 0.45f, -35), whiteMat);
    }

    private void CreateCar(string name, Vector3 position, Material mat)
    {
        GameObject carRoot = new GameObject(name);
        carRoot.transform.SetParent(root);
        carRoot.transform.position = position;

        GameObject body = Cube(name + "_Govde", position, new Vector3(3.1f, 0.65f, 1.55f), mat);
        GameObject top = Cube(name + "_UstKisim", position + new Vector3(0, 0.55f, 0), new Vector3(1.65f, 0.55f, 1.1f), mat);

        GameObject w1 = Cube(name + "_Teker_01", position + new Vector3(-1.1f, -0.35f, -0.82f), new Vector3(0.45f, 0.45f, 0.25f), blackMat);
        GameObject w2 = Cube(name + "_Teker_02", position + new Vector3(1.1f, -0.35f, -0.82f), new Vector3(0.45f, 0.45f, 0.25f), blackMat);
        GameObject w3 = Cube(name + "_Teker_03", position + new Vector3(-1.1f, -0.35f, 0.82f), new Vector3(0.45f, 0.45f, 0.25f), blackMat);
        GameObject w4 = Cube(name + "_Teker_04", position + new Vector3(1.1f, -0.35f, 0.82f), new Vector3(0.45f, 0.45f, 0.25f), blackMat);

        body.transform.SetParent(carRoot.transform);
        top.transform.SetParent(carRoot.transform);
        w1.transform.SetParent(carRoot.transform);
        w2.transform.SetParent(carRoot.transform);
        w3.transform.SetParent(carRoot.transform);
        w4.transform.SetParent(carRoot.transform);
    }

    private void CreateLandscape()
    {
        for (int i = 0; i < 13; i++)
        {
            float x = -45 + i * 7.5f;
            CreateTree(new Vector3(x, 0, -48));
        }

        for (int i = 0; i < 7; i++)
        {
            CreateTree(new Vector3(-42, 0, -24 + i * 6));
            CreateTree(new Vector3(43, 0, -24 + i * 6));
        }

        CreateTree(new Vector3(-8, 0, -22));
        CreateTree(new Vector3(8, 0, -22));

        Cube("Landscape_BahceYolu_Sol", new Vector3(-28, 0.08f, -15), new Vector3(4.5f, 0.08f, 22), concreteMat);
        Cube("Landscape_BahceYolu_Sag", new Vector3(32, 0.08f, -13), new Vector3(4.5f, 0.08f, 20), concreteMat);
    }

    private void CreateTree(Vector3 position)
    {
        Cylinder("Tree_Govde", position + new Vector3(0, 0.8f, 0), new Vector3(0.32f, 0.85f, 0.32f), brownMat);
        Sphere("Tree_Tac", position + new Vector3(0, 2.2f, 0), new Vector3(2.2f, 2.2f, 2.2f), greenMat);
    }

    private void CreateLightingAndCamera()
    {
        GameObject oldCamera = GameObject.Find("Main Camera");
        if (oldCamera != null)
        {
            if (Application.isPlaying)
                Destroy(oldCamera);
            else
                DestroyImmediate(oldCamera);
        }

        GameObject oldLight = GameObject.Find("Directional Light");
        if (oldLight != null)
        {
            if (Application.isPlaying)
                Destroy(oldLight);
            else
                DestroyImmediate(oldLight);
        }

        GameObject lightObj = new GameObject("Sun_DirectionalLight");
        lightObj.transform.SetParent(root);

        Light light = lightObj.AddComponent<Light>();
        light.type = LightType.Directional;
        light.intensity = 1.35f;
        lightObj.transform.rotation = Quaternion.Euler(48, -35, 0);

        GameObject camObj = new GameObject("Main Camera");
        camObj.transform.SetParent(root);
        camObj.tag = "MainCamera";

        Camera cam = camObj.AddComponent<Camera>();
        camObj.transform.position = new Vector3(35, 22, -46);
        camObj.transform.LookAt(new Vector3(0, 5, -5));
        cam.fieldOfView = 42;
    }
}